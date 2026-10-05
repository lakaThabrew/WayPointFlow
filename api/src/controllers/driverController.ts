import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripStatus, StopStatus, OrderStatus } from '@prisma/client';

export const getDriverRoute = async (req: Request, res: Response) => {
  try {
    const { id, depot } = req.authUser!;

    // The schema has no driver→vehicle assignment, so the driver's depot scopes
    // the fleet he may drive. Drivers without a depot fall back to the whole fleet.
    const trips = await prisma.trip.findMany({
      where: {
        status: { in: [TripStatus.READY, TripStatus.IN_TRANSIT] },
        ...(depot ? { vehicle: { depot } } : {}),
      },
      include: {
        vehicle: true,
        stops: {
          orderBy: { sequence: 'asc' },
          include: {
            outlet: true,
            order: true,
            proofOfDelivery: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      },
      take: 1
    });

    res.json(trips[0] || null);
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ error: 'Failed to fetch driver trips' });
  }
};

/** A trip is COMPLETED once every stop has been resolved (COMPLETED or ISSUE). */
async function completeTripIfFinished(tripId: string) {
  const remaining = await prisma.tripStop.count({
    where: { tripId, status: { in: [StopStatus.PENDING, StopStatus.ARRIVED] } },
  });
  if (remaining === 0) {
    await prisma.trip.update({ where: { id: tripId }, data: { status: TripStatus.COMPLETED } });
  }
}

export const markStopArrival = async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, include: { trip: true } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });
    if (stop.status === StopStatus.ISSUE) {
      return res.status(409).json({ error: 'Cannot arrive at a stop that reported an issue' });
    }

    const arrivedAt = new Date();
    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.ARRIVED,
        actualArrival: stop.actualArrival ?? arrivedAt,
        arrivedAt: stop.arrivedAt ?? arrivedAt
      }
    });

    if (stop.trip.status === TripStatus.READY) {
      await prisma.trip.update({
        where: { id: stop.tripId },
        data: { status: TripStatus.IN_TRANSIT }
      });
    }

    res.json(updatedStop);
  } catch (error) {
    console.error('Error marking arrival:', error);
    res.status(500).json({ error: 'Failed to mark arrival' });
  }
};

export const completeDelivery = async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const { receiverName, signatureNote } = req.body ?? {};

    if (typeof receiverName !== 'string' || !receiverName.trim()) {
      return res.status(400).json({ error: 'Receiver name is required' });
    }

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });
    if (stop.status === StopStatus.ISSUE) {
      return res.status(409).json({ error: 'Cannot complete a stop that reported an issue' });
    }
    if (stop.status === StopStatus.COMPLETED) {
      return res.status(409).json({ error: 'Stop is already completed' });
    }

    // 1. Create PoD
    const pod = await prisma.proofOfDelivery.upsert({
      where: { stopId },
      update: {
        receiverName: receiverName.trim(),
        signatureNote: signatureNote || '',
        recordedAt: new Date(),
        synced: true
      },
      create: {
        stopId,
        receiverName: receiverName.trim(),
        signatureNote: signatureNote || '',
        recordedAt: new Date(),
        synced: true
      }
    });

    // 2. Update Stop
    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.COMPLETED,
        leftAt: stop.leftAt ?? new Date()
      }
    });

    // 3. Update Order
    await prisma.order.update({
      where: { id: stop.orderId },
      data: {
        status: OrderStatus.DELIVERED
      }
    });

    await completeTripIfFinished(stop.tripId);

    res.json({ stop: updatedStop, pod });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
};

export const reportIssue = async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const { issueReason, description } = req.body ?? {};

    if (typeof issueReason !== 'string' || !issueReason.trim()) {
      return res.status(400).json({ error: 'issueReason is required' });
    }

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });
    if (stop.status === StopStatus.COMPLETED) {
      return res.status(409).json({ error: 'Cannot report an issue on a completed stop' });
    }

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.ISSUE,
        leftAt: stop.leftAt ?? new Date()
      }
    });

    // We can update order status as well
    await prisma.order.update({
      where: { id: stop.orderId },
      data: {
        status: OrderStatus.AT_RISK,
        notes: `Delivery Issue: ${issueReason} - ${description ?? ''}`
      }
    });

    await completeTripIfFinished(stop.tripId);

    res.json(updatedStop);
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
};

/** Client timestamps are untrusted — fall back to "now" instead of throwing on garbage. */
function eventTime(raw: unknown): Date {
  const d = new Date(raw as string | number);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

export const syncEvents = async (req: Request, res: Response) => {
  try {
    const { events } = req.body ?? {};
    const userRole = req.authUser!.role;

    if (!Array.isArray(events)) {
      return res.status(400).json({ error: 'events must be an array' });
    }
    if (events.length === 0) {
      return res.json({ success: true, processed: [], failed: [] });
    }

    const processed: string[] = [];
    const failed: Array<{ clientUuid: string; error: string }> = [];

    // Process each event sequentially
    for (const event of events) {
      const clientUuid = event?.clientUuid;
      const type = event?.type;

      if (typeof clientUuid !== 'string' || !clientUuid) {
        failed.push({ clientUuid: String(clientUuid), error: 'clientUuid is required' });
        continue;
      }
      if (type !== 'ARRIVE' && type !== 'COMPLETE' && type !== 'ISSUE') {
        failed.push({ clientUuid, error: `Unsupported event type: ${String(type)}` });
        continue;
      }

      // Idempotency: an already-recorded clientUuid is acknowledged, not re-applied.
      const existing = await prisma.syncEvent.findUnique({
        where: { clientUuid }
      });
      if (existing) {
        processed.push(clientUuid);
        continue;
      }

      try {
        const at = eventTime(event.timestamp);

        if (type === 'ARRIVE') {
          const { stopId } = event.data ?? {};
          const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, include: { trip: true } });
          if (stop && stop.status !== StopStatus.ISSUE) {
            await prisma.tripStop.update({
              where: { id: stopId },
              data: {
                status: StopStatus.ARRIVED,
                actualArrival: stop.actualArrival ?? at,
                arrivedAt: stop.arrivedAt ?? at
              }
            });
            if (stop.trip.status === TripStatus.READY) {
              await prisma.trip.update({
                where: { id: stop.tripId },
                data: { status: TripStatus.IN_TRANSIT }
              });
            }
          }
        } else if (type === 'COMPLETE') {
          const { stopId, receiverName, signatureNote } = event.data ?? {};
          const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
          if (stop && stop.status !== StopStatus.ISSUE) {
            const name = typeof receiverName === 'string' && receiverName.trim() ? receiverName.trim() : 'Store Manager';
            await prisma.proofOfDelivery.upsert({
              where: { stopId },
              update: {
                receiverName: name,
                signatureNote: signatureNote || '',
                recordedAt: at,
                synced: true
              },
              create: {
                stopId,
                receiverName: name,
                signatureNote: signatureNote || '',
                recordedAt: at,
                synced: true
              }
            });
            await prisma.tripStop.update({
              where: { id: stopId },
              data: { status: StopStatus.COMPLETED, leftAt: stop.leftAt ?? at }
            });
            await prisma.order.update({
              where: { id: stop.orderId },
              data: { status: OrderStatus.DELIVERED }
            });
            await completeTripIfFinished(stop.tripId);
          }
        } else {
          const { stopId, issueReason, description } = event.data ?? {};
          const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
          if (stop && stop.status !== StopStatus.COMPLETED) {
            await prisma.tripStop.update({
              where: { id: stopId },
              data: { status: StopStatus.ISSUE, leftAt: stop.leftAt ?? at }
            });
            await prisma.order.update({
              where: { id: stop.orderId },
              data: {
                status: OrderStatus.AT_RISK,
                notes: `Delivery Issue: ${issueReason ?? 'Unknown'} - ${description ?? ''}`
              }
            });
            await completeTripIfFinished(stop.tripId);
          }
        }

        // Record the sync event to ensure idempotency
        await prisma.syncEvent.create({
          data: {
            clientUuid,
            role: userRole,
            payloadJson: event.data ?? {},
            createdOfflineAt: at,
            syncedAt: new Date()
          }
        });
        processed.push(clientUuid);
      } catch (err) {
        console.error(`Failed to process event ${clientUuid}:`, err);
        failed.push({ clientUuid, error: err instanceof Error ? err.message : 'Processing failed' });
      }
    }

    // `processed` lets the client drop only the events the server actually accepted,
    // so a partial failure stays in the outbox for a later retry (TC-7.6 / TC-7.7).
    res.json({ success: failed.length === 0, processed, failed });
  } catch (error) {
    console.error('Error syncing events:', error);
    res.status(500).json({ error: 'Failed to sync events' });
  }
};
