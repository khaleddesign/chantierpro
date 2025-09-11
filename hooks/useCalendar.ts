'use client';

import { useState, useEffect } from 'react';

export type CalendarView = 'month' | 'week' | 'day';

interface CalendarEvent {
  id: string;
  titre: string;
  dateDebut: Date;
  dateFin: Date;
  type: string;
  chantier?: {
    id: string;
    nom: string;
  };
}

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const fetchEvents = async (startDate: Date, endDate: Date) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        dateDebut: startDate.toISOString(),
        dateFin: endDate.toISOString()
      });

      const response = await fetch(`/api/planning?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        const calendarEvents = data.planning.map((event: any) => ({
          ...event,
          dateDebut: new Date(event.dateDebut),
          dateFin: new Date(event.dateFin)
        }));
        setEvents(calendarEvents);
      }
    } catch (error) {
      console.error('Erreur chargement événements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getViewDates = (date: Date, viewType: CalendarView) => {
    const start = new Date(date);
    const end = new Date(date);

    switch (viewType) {
      case 'month':
        start.setDate(1);
        start.setHours(0, 0, 0, 0);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        end.setHours(23, 59, 59, 999);
        break;
      case 'week':
        const dayOfWeek = start.getDay();
        start.setDate(start.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        break;
      case 'day':
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);
        break;
    }

    return { start, end };
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (view) {
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const goToDate = (date: Date) => {
    setCurrentDate(date);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.dateDebut);
      return eventDate.toDateString() === date.toDateString();
    });
  };

  const getEventsInRange = (startDate: Date, endDate: Date) => {
    return events.filter(event => {
      const eventStart = new Date(event.dateDebut);
      const eventEnd = new Date(event.dateFin);
      
      return (eventStart <= endDate && eventEnd >= startDate);
    });
  };

  useEffect(() => {
    const { start, end } = getViewDates(currentDate, view);
    fetchEvents(start, end);
  }, [currentDate, view]);

  return {
    currentDate,
    view,
    events,
    loading,
    selectedDate,
    actions: {
      setView,
      navigateDate,
      goToToday,
      goToDate,
      setSelectedDate,
      getEventsForDate,
      getEventsInRange,
      refreshEvents: () => {
        const { start, end } = getViewDates(currentDate, view);
        fetchEvents(start, end);
      }
    },
    utils: {
      getViewDates,
      formatDate: (date: Date) => date.toLocaleDateString('fr-FR'),
      formatTime: (date: Date) => date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  };
}
