'use client';

import { useState } from 'react';
import { useCalendar } from '@/hooks/useCalendar';
import { usePlanning } from '@/hooks/usePlanning';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarProps {
  onEventClick?: (event: any) => void;
  onDateClick?: (date: Date) => void;
  onNewEvent?: () => void;
}

export default function Calendar({ onEventClick, onDateClick, onNewEvent }: CalendarProps) {
  const { currentDate, view, events, loading, actions, utils } = useCalendar();
  const { planning } = usePlanning({ 
    dateDebut: utils.getViewDates(currentDate, view).start.toISOString(),
    dateFin: utils.getViewDates(currentDate, view).end.toISOString() 
  });

  const getEventColor = (type: string) => {
    const colors = {
      REUNION: 'bg-blue-500',
      LIVRAISON: 'bg-green-500',
      INSPECTION: 'bg-orange-500',
      AUTRE: 'bg-gray-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  const renderMonthView = () => {
    const { start } = utils.getViewDates(currentDate, 'month');
    const startDate = new Date(start);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const days = [];
    const today = new Date();
    
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayEvents = actions.getEventsForDate(date);
      const isCurrentMonth = date.getMonth() === currentDate.getMonth();
      const isToday = date.toDateString() === today.toDateString();
      
      days.push(
        <div
          key={i}
          className={`
            min-h-[120px] border border-gray-200 p-2 cursor-pointer hover:bg-gray-50
            ${!isCurrentMonth ? 'bg-gray-100 text-gray-400' : 'bg-white'}
            ${isToday ? 'bg-blue-50 border-blue-300' : ''}
          `}
          onClick={() => onDateClick?.(date)}
        >
          <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-600' : ''}`}>
            {date.getDate()}
          </div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map((event: any) => (
              <div
                key={event.id}
                className={`
                  text-xs p-1 rounded text-white cursor-pointer truncate
                  ${getEventColor(event.type)}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  onEventClick?.(event);
                }}
              >
                {event.titre}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">
                +{dayEvents.length - 3} autres
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200">
        {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map(day => (
          <div key={day} className="bg-gray-50 p-3 text-center font-medium text-sm border-b">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  const renderWeekView = () => {
    const { start } = utils.getViewDates(currentDate, 'week');
    const weekDays: Date[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="grid grid-cols-8 gap-0 border border-gray-200 min-h-[600px]">
        <div className="bg-gray-50 border-b"></div>
        {weekDays.map(date => (
          <div key={date.toDateString()} className="bg-gray-50 p-3 text-center border-b">
            <div className="font-medium">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
            <div className="text-2xl">{date.getDate()}</div>
          </div>
        ))}
        
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="contents">
            <div className="bg-gray-50 p-2 text-xs text-right border-b border-r">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map(date => {
              const hourEvents = events.filter(event => {
                const eventDate = new Date(event.dateDebut);
                return eventDate.toDateString() === date.toDateString() && 
                       eventDate.getHours() === hour;
              });
              
              return (
                <div
                  key={`${date.toDateString()}-${hour}`}
                  className="border-b border-r p-1 cursor-pointer hover:bg-gray-50 relative"
                  onClick={() => {
                    const clickDate = new Date(date);
                    clickDate.setHours(hour, 0, 0, 0);
                    onDateClick?.(clickDate);
                  }}
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-xs p-1 mb-1 rounded text-white cursor-pointer
                        ${getEventColor(event.type)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      {event.titre}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  };

  const renderDayView = () => {
    const dayEvents = actions.getEventsForDate(currentDate);
    
    return (
      <div className="grid grid-cols-2 gap-0 border border-gray-200 min-h-[600px]">
        <div>
          {Array.from({ length: 24 }, (_, hour) => {
            const hourEvents = dayEvents.filter(event => {
              const eventDate = new Date(event.dateDebut);
              return eventDate.getHours() === hour;
            });
            
            return (
              <div key={hour} className="flex border-b min-h-[50px]">
                <div className="w-16 bg-gray-50 p-2 text-xs text-right border-r">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div 
                  className="flex-1 p-2 cursor-pointer hover:bg-gray-50"
                  onClick={() => {
                    const clickDate = new Date(currentDate);
                    clickDate.setHours(hour, 0, 0, 0);
                    onDateClick?.(clickDate);
                  }}
                >
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={`
                        text-sm p-2 mb-1 rounded text-white cursor-pointer
                        ${getEventColor(event.type)}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventClick?.(event);
                      }}
                    >
                      <div className="font-medium">{event.titre}</div>
                      <div className="text-xs opacity-90">
                        {utils.formatTime(new Date(event.dateDebut))} - {utils.formatTime(new Date(event.dateFin))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="bg-gray-50 p-4">
          <h3 className="font-medium mb-4">Événements du jour</h3>
          <div className="space-y-2">
            {dayEvents.map(event => (
              <div
                key={event.id}
                className="bg-white p-3 rounded border cursor-pointer hover:shadow-md"
                onClick={() => onEventClick?.(event)}
              >
                <div className="font-medium">{event.titre}</div>
                <div className="text-sm text-gray-600">
                  {utils.formatTime(new Date(event.dateDebut))} - {utils.formatTime(new Date(event.dateFin))}
                </div>
                {event.chantier && (
                  <div className="text-xs text-gray-500 mt-1">
                    📍 {event.chantier.nom}
                  </div>
                )}
              </div>
            ))}
            {dayEvents.length === 0 && (
              <div className="text-gray-500 text-center py-8">
                Aucun événement aujourd'hui
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => actions.navigateDate('prev')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={actions.goToToday}
              className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
            >
              Aujourd'hui
            </button>
            <button
              onClick={() => actions.navigateDate('next')}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
          
          <h2 className="text-xl font-semibold">
            {currentDate.toLocaleDateString('fr-FR', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h2>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex border border-gray-300 rounded overflow-hidden">
            {(['month', 'week', 'day'] as const).map(viewType => (
              <button
                key={viewType}
                onClick={() => actions.setView(viewType)}
                className={`
                  px-3 py-1 text-sm border-r last:border-r-0
                  ${view === viewType ? 'bg-blue-500 text-white' : 'bg-white hover:bg-gray-50'}
                `}
              >
                {viewType === 'month' ? 'Mois' : viewType === 'week' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
          
          {onNewEvent && (
            <button
              onClick={onNewEvent}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              <Plus className="w-4 h-4" />
              <span>Nouvel événement</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center space-x-3">
              <CalendarIcon className="w-8 h-8 text-gray-400 animate-pulse" />
              <span className="text-gray-500">Chargement du calendrier...</span>
            </div>
          </div>
        ) : (
          <>
            {view === 'month' && renderMonthView()}
            {view === 'week' && renderWeekView()}
            {view === 'day' && renderDayView()}
          </>
        )}
      </div>
    </div>
  );
}
