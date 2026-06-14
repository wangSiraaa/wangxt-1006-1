import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import RoleSelect from "@/pages/RoleSelect";
import ConsultantLayout from "@/components/ConsultantLayout";
import ParentLayout from "@/components/ParentLayout";
import TeacherLayout from "@/components/TeacherLayout";
import Courses from "@/pages/consultant/Courses";
import Schedule from "@/pages/consultant/Schedule";
import Waitlist from "@/pages/consultant/Waitlist";
import Funnel from "@/pages/consultant/Funnel";
import Rules from "@/pages/consultant/Rules";
import Audit from "@/pages/consultant/Audit";
import Book from "@/pages/parent/Book";
import Status from "@/pages/parent/Status";
import Roster from "@/pages/teacher/Roster";
import Report from "@/pages/teacher/Report";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleSelect />} />
        <Route path="/consultant" element={<ConsultantLayout />}>
          <Route index element={<Navigate to="courses" replace />} />
          <Route path="courses" element={<Courses />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="waitlist" element={<Waitlist />} />
          <Route path="funnel" element={<Funnel />} />
          <Route path="rules" element={<Rules />} />
          <Route path="audit" element={<Audit />} />
        </Route>
        <Route path="/parent" element={<ParentLayout />}>
          <Route index element={<Navigate to="book" replace />} />
          <Route path="book" element={<Book />} />
          <Route path="status" element={<Status />} />
        </Route>
        <Route path="/teacher" element={<TeacherLayout />}>
          <Route index element={<Navigate to="roster" replace />} />
          <Route path="roster" element={<Roster />} />
          <Route path="report" element={<Report />} />
        </Route>
      </Routes>
    </Router>
  );
}
