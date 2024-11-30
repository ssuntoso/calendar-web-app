import { useEffect, useState } from 'react';
import './App.css';
import { ScheduleComponent, ViewsDirective, ViewDirective, Inject, Day, Month, Week } from '@syncfusion/ej2-react-schedule';
import { registerLicense } from '@syncfusion/ej2-base';

registerLicense(
  "Ngo9BigBOggjHTQxAR8/V1NDaF1cX2hIfExxWmFZfVpgcF9CZFZSQGYuP1ZhSXxXd0RgWX9adHBWQmdYVEA="
)

const backendEndpoint = 'http://localhost:3000'

const user_id = 1

const formatDate = (date) => {
  // format date object to 'YYYY-MM-DD HH:MM:SS'
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`
}

const onActionBegin = (event) => {
  if (event.requestType === 'eventCreate') {
    let event_data =  {
      user_id: user_id,
      subject_id: event.data[0].Id,
      subject: event.data[0].Subject,
      start_time_zone: event.data[0].StartTimezone || "Asia/Hong_Kong",
      start_time: formatDate(event.data[0].StartTime),
      end_time_zone: event.data[0].EndTimezone || "Asia/Hong_Kong",
      end_time: formatDate(event.data[0].EndTime),
      all_day_event: event.data[0].IsAllDay,
      description: event.data[0].Description,
      location: event.data[0].Location
    }
    // post request to addSubject
    fetch(`${backendEndpoint}/addSubject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event_data)
    })
    .catch((error) => console.error('Error:', error));

  } else if (event.requestType === 'eventChange') {
    const event_data =  {
      user_id: user_id,
      subject_id: event.data.Id,
      subject: event.data.Subject,
      start_time_zone: event.data.StartTimezone || "Asia/Hong_Kong",
      start_time: formatDate(event.data.StartTime),
      end_time_zone: event.data.EndTimezone || "Asia/Hong_Kong",
      end_time: formatDate(event.data.EndTime),
      all_day_event: event.data.IsAllDay,
      description: event.data.Description,
      location: event.data.Location
    }
    // put request to updateSubject
    fetch(`${backendEndpoint}/updateSubject`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event_data)
    })
    .catch((error) => console.error('Error:', error));
  } else if (event.requestType === 'eventRemove') {
    event.data.map ( async(e_data) => {
      return fetch(`${backendEndpoint}/deleteSubject`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: user_id,
          subject_id: e_data.Id
        })
      })
      .then(response => response.json())
      .catch((error) => console.error('Error:', error));
    });
  }
};

function App() {
  const [data, setData] = useState([]);
  useEffect(() => {
    // get request to getSubjects
    fetch(`${backendEndpoint}/getSubjects?user_id=1`)
      .then(response => response.json())
      .then(events => {
        setData(events.map(event => {
          return {
            Id: event.subject_id,
            Subject: event.subject,
            StartTime: new Date(event.start_time),
            StartTimezone: event.start_time_zone,
            EndTime: new Date(event.end_time),
            EndTimezone: event.end_time_zone,
            IsAllDay: event.all_day_event,
            RecurrenceRule: event.reccurence_rule,
            Description: event.description,
            Location: event.location
          }
        }))
      })
      .catch((error) => console.error('Error:', error));
  }, []);
  return (
    <div className="container mx-auto">
      <div className="p-5">
        <h1 className="text-3xl font-bold mt-10 mb-10 text-center">Calendar</h1>
        <ScheduleComponent 
          width='100%'
          height='85vh'
          // editorTemplate={}
          eventSettings={{
            dataSource: data
          }}
          actionBegin={onActionBegin}
          timezone='Asia/Hong_Kong'
        >
          <ViewsDirective>
            <ViewDirective option='Day'/>
            <ViewDirective option='Week'/>
            <ViewDirective option='Month'/>
          </ViewsDirective>
          <Inject services={[Day, Week, Month]}/>
        </ScheduleComponent>
      </div>
    </div>
  );
}

export default App;
