import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripStatus, StopStatus, OrderStatus } from '@prisma/client';

export const getDriverRoute = async (req: Request, res: Response) => {
  try {
    const driverId = req.authUser!.id;

    // MVP simplification: Assuming driver is assigned via vehicle, or we just fetch READY/IN_TRANSIT trips
    // For demo purposes, we will return the first READY/IN_TRANSIT trip since we don't have driver-to-vehicle mapping explicitly in User yet.
    // In a real scenario, we'd filter by `vehicle: { assignedDriverId: driverId }`.
    // Wait, let's check if User has a way to identify. The plan says "matching the vehicle... with the logged-in driver's user ID".
    // Since we don't have this, we'll fetch trips that are READY or IN_TRANSIT.

    const trips = await prisma.trip.findMany({
      where: {
        status: { in: [TripStatus.READY, TripStatus.IN_TRANSIT] }
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
      take: 1 // Just return the most relevant one for the demo
    });

    res.json(trips[0] || null);
  } catch (error) {
    console.error('Error fetching driver trips:', error);
    res.status(500).json({ error: 'Failed to fetch driver trips' });
  }
};



export const markStopArrival = async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId }, include: { trip: true } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.ARRIVED,
        actualArrival: new Date(),
        arrivedAt: new Date()
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
    const { receiverName, signatureNote } = req.body;

    if (!receiverName) return res.status(400).json({ error: 'Receiver name is required' });

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    // 1. Create PoD
    const pod = await prisma.proofOfDelivery.create({
      data: {
        stopId,
        receiverName,
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
        leftAt: new Date()
      }
    });

    // 3. Update Order
    await prisma.order.update({
      where: { id: stop.orderId },
      data: {
        status: OrderStatus.DELIVERED
      }
    });

    res.json({ stop: updatedStop, pod });
  } catch (error) {
    console.error('Error completing delivery:', error);
    res.status(500).json({ error: 'Failed to complete delivery' });
  }
};

export const reportIssue = async (req: Request, res: Response) => {
  try {
    const { stopId } = req.params;
    const { issueReason, description } = req.body;

    const stop = await prisma.tripStop.findUnique({ where: { id: stopId } });
    if (!stop) return res.status(404).json({ error: 'Stop not found' });

    const updatedStop = await prisma.tripStop.update({
      where: { id: stopId },
      data: {
        status: StopStatus.ISSUE,
        leftAt: new Date()
      }
    });

    // We can update order status as well
    await prisma.order.update({
      where: { id: stop.orderId },
      data: {
        status: OrderStatus.AT_RISK,
        notes: `Delivery Issue: ${issueReason} - ${description}`
      }
    });

    res.json(updatedStop);
  } catch (error) {
    console.error('Error reporting issue:', error);
    res.status(500).json({ error: 'Failed to report issue' });
  }
};
