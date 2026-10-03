import type { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { TripStatus } from '@prisma/client';

export const getLoadingQueue = async (req: Request, res: Response) => {
  try {
    const trips = await prisma.trip.findMany({
      where: {
        status: TripStatus.RELEASED,
      },
      include: {
        vehicle: true,
        stops: {
          include: {
            order: true,
          }
        },
      },
      orderBy: {
        plannedDeparture: 'asc',
      }
    });

    const queue = trips.map(trip => {
      const totalQuantity = trip.stops.reduce((sum, stop) => sum + stop.order.units, 0);
      return {
        id: trip.id,
        tripNumber: trip.tripNumber,
        date: trip.date,
        brand: trip.brand,
        district: trip.district,
        status: trip.status,
        plannedDeparture: trip.plannedDeparture,
        vehicle: trip.vehicle,
        stopCount: trip.stops.length,
        totalQuantity,
      };
    });

    res.json(queue);
  } catch (error) {
    console.error('Error fetching loading queue:', error);
    res.status(500).json({ error: 'Failed to fetch loading queue' });
  }
};

export const getTripManifest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        vehicle: true,
        stops: {
          orderBy: { sequence: 'asc' },
          include: {
            order: {
              include: {
                outlet: true
              }
            },
            outlet: true
          }
        }
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip manifest:', error);
    res.status(500).json({ error: 'Failed to fetch trip manifest' });
  }
};

export const submitLoadingEvent = async (req: Request, res: Response) => {
  try {
    const { tripId, orderId, loadedQty, expectedQty } = req.body;
    const userId = req.authUser!.id;

    if (!tripId || !orderId || loadedQty === undefined || expectedQty === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const shortfallFlag = loadedQty < expectedQty;

    const event = await prisma.loadingEvent.create({
      data: {
        tripId,
        orderId,
        loadedQty,
        expectedQty,
        shortfallFlag,
        createdBy: userId,
      }
    });

    res.json(event);
  } catch (error) {
    console.error('Error submitting loading event:', error);
    res.status(500).json({ error: 'Failed to submit loading event' });
  }
};

export const markTripReady = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: {
        stops: true,
        loadingEvents: true
      }
    });

    if (!trip) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    if (trip.status !== TripStatus.RELEASED) {
      return res.status(400).json({ error: 'Trip must be in RELEASED status to mark as ready' });
    }

    // Optional validation: check if all orders have loading events
    // For now, MVP assumes if loader clicks ready, it's ready.

    const updatedTrip = await prisma.trip.update({
      where: { id },
      data: {
        status: TripStatus.READY
      }
    });

    res.json(updatedTrip);
  } catch (error) {
    console.error('Error marking trip ready:', error);
    res.status(500).json({ error: 'Failed to mark trip ready' });
  }
};
