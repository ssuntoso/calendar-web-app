import { useEffect, useState } from "react";
import "../index.css";
import {
  ScheduleComponent,
  ViewsDirective,
  ViewDirective,
  Inject,
  Day,
  Month,
  Week,
} from "@syncfusion/ej2-react-schedule";
import { registerLicense } from "@syncfusion/ej2-base";
import { Cookies } from "react-cookie";
import Button from "../components/button";
import { DateTime } from "luxon";

registerLicense(process.env.REACT_APP_SYNCFUSION_LICENSE);

const backendEndpoint = `${process.env.REACT_APP_API_URL}${process.env.REACT_APP_API_VERSION}${process.env.REACT_APP_API_EVENT}`;
const cookies = new Cookies();

const formatDate = (date) => {
  // format date object to 'YYYY-MM-DD HH:MM:SS'
  return `${date.getFullYear()}-${(date.getMonth() + 1)
    .toString()
    .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")} ${date
    .getHours()
    .toString()
    .padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}:${date
    .getSeconds()
    .toString()
    .padStart(2, "0")}`;
};

const formatDateTime = (date) => {
  // format date object to 'YYYY-MM-DDTHH:MM:SS'
  return `${date.year}-${date.month.toString().padStart(2, "0")}-${date.day
    .toString()
    .padStart(2, "0")} ${date.hour.toString().padStart(2, "0")}:${date.minute
    .toString()
    .padStart(2, "0")}:${date.second.toString().padStart(2, "0")}`;
};

const onActionBegin = (event) => {
  if (event.requestType === "eventCreate") {
    const event_data = [
      {
        user_id: cookies.get("auth").user_id,
        subject_id: event.data[0].Id,
        subject: event.data[0].Subject,
        start_time_zone: event.data[0].StartTimezone || "Asia/Hong_Kong",
        start_time: formatDate(event.data[0].StartTime),
        end_time_zone: event.data[0].EndTimezone || "Asia/Hong_Kong",
        end_time: formatDate(event.data[0].EndTime),
        all_day_event: event.data[0].IsAllDay,
        description: event.data[0].Description,
        location: event.data[0].Location,
      },
    ];
    // post request to addSubject
    fetch(`${backendEndpoint}/addSubject`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("auth").token}`,
      },
      body: JSON.stringify(event_data),
    })
      .then((response) => response.json())
      .catch((error) => console.error("Error:", error));
  } else if (event.requestType === "eventChange") {
    const event_data = {
      user_id: cookies.get("auth").user_id,
      subject_id: event.data.Id,
      subject: event.data.Subject,
      start_time_zone: event.data.StartTimezone || "Asia/Hong_Kong",
      start_time: formatDate(event.data.StartTime),
      end_time_zone: event.data.EndTimezone || "Asia/Hong_Kong",
      end_time: formatDate(event.data.EndTime),
      all_day_event: event.data.IsAllDay,
      description: event.data.Description,
      location: event.data.Location,
    };
    // put request to updateSubject
    fetch(`${backendEndpoint}/updateSubject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cookies.get("auth").token}`,
      },
      body: JSON.stringify(event_data),
    }).catch((error) => console.error("Error:", error));
  } else if (event.requestType === "eventRemove") {
    event.data.map(async (e_data) => {
      return fetch(`${backendEndpoint}/deleteSubject`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${cookies.get("auth").token}`,
        },
        body: JSON.stringify({
          user_id: cookies.get("auth").user_id,
          subject_id: e_data.Id,
        }),
      })
        .then((response) => response.json())
        .catch((error) => console.error("Error:", error));
    });
  }
};

function Calendar() {
  const [data, setData] = useState([]);
  useEffect(() => {
    // get request to getSubjects
    if (!cookies.get("auth")?.token) {
      window.location.href = "/login";
    } else {
      const user_id = cookies.get("auth").user_id;
      fetch(`${backendEndpoint}/getSubjects?user_id=${user_id}`, {
        headers: {
          Authorization: `Bearer ${cookies.get("auth").token}`,
        },
      })
        .then((response) => response.json())
        .then((events) => {
          if (events.message) {
            alert(events.message);
          }
          setData(
            events.map((event) => {
              const startTime = DateTime.fromFormat(
                event.start_time,
                "yyyy-MM-dd HH:mm:ss",
                { zone: event.start_time_zone }
              ).setZone("Asia/Hong_Kong");
              const endTime = DateTime.fromFormat(
                event.end_time,
                "yyyy-MM-dd HH:mm:ss",
                { zone: event.end_time_zone }
              ).setZone("Asia/Hong_Kong");
              return {
                Id: event.subject_id,
                Subject: event.subject,
                StartTime: formatDateTime(startTime),
                StartTimezone: event.start_time_zone,
                EndTime: formatDateTime(endTime),
                EndTimezone: event.end_time_zone,
                IsAllDay: event.all_day_event,
                RecurrenceRule: event.reccurence_rule,
                Description: event.description,
                Location: event.location,
              };
            })
          );
        })
        .catch((error) => console.error("Error:", error));
    }
  }, []);
  return (
    <div className="container mx-auto max-w-5xl">
      <div className="p-5">
        <div className="flex justify-between items-center mt-5 mb-5">
          <h1 className="text-3xl font-bold">Calendar</h1>
          <Button
            text="Import From CSV"
            onClick={() => (window.location.href = "/import-csv")}
          />
        </div>
        <ScheduleComponent
          width="100%"
          height="80vh"
          // editorTemplate={}
          eventSettings={{
            dataSource: data,
          }}
          actionBegin={onActionBegin}
          timezone="Asia/Hong_Kong"
        >
          <ViewsDirective>
            <ViewDirective option="Day" />
            <ViewDirective option="Week" />
            <ViewDirective option="Month" />
          </ViewsDirective>
          <Inject services={[Day, Week, Month]} />
        </ScheduleComponent>
        <p className="text-xs italic mt-5">* All schedule is displayed in Hong Kong Timezone (GMT +8)</p>
      </div>
    </div>
  );
}

export default Calendar;
