import React from 'react';

interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  ruleCitation?: string;
  description: string;
  status: 'completed' | 'pending' | 'overdue';
  daysFromStart: number;
}

interface CaseTimelineProps {
  events: TimelineEvent[];
  totalDays: number;
}

const CaseTimeline: React.FC<CaseTimelineProps> = ({ events, totalDays }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-blue-500';
      case 'overdue': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return 'Unknown';
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Case Timeline</h3>
      
      {/* Timeline Bar */}
      <div className="relative mb-6">
        <div className="h-2 bg-gray-200 rounded-full">
          {events.map((event) => (
            <div
              key={event.id}
              className={`absolute h-2 rounded-full ${getStatusColor(event.status)} transition-all duration-300 hover:scale-105`}
              style={{
                left: `${(event.daysFromStart / totalDays) * 100}%`,
                width: '4px',
                transform: 'translateX(-50%)',
                cursor: 'pointer'
              }}
              title={`${event.title} - ${event.date}`}
            />
          ))}
        </div>
        
        {/* Timeline Labels */}
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Day 0</span>
          <span>Day {totalDays}</span>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-4">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start space-x-4 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
          >
            <div className={`w-3 h-3 rounded-full mt-2 ${getStatusColor(event.status)}`} />
            
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h4 className="font-medium text-gray-800">{event.title}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  event.status === 'completed' ? 'bg-green-100 text-green-800' :
                  event.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {getStatusText(event.status)}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-1">{event.description}</p>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{event.date}</span>
                {event.ruleCitation && (
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {event.ruleCitation}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CaseTimeline; 