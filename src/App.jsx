import { Route, Routes } from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Application from "./pages/Application";
import PiRecords from "./pages/PiRecords";
import Specialties from "./pages/Specialties";
import InstitutionTeam from "./pages/InstitutionTeam";
import InstitutionFiles from "./pages/InstitutionFiles";
import PublishNotice from "./pages/PublishNotice";
import NoticeGroupManagement from "./pages/NoticeGroupManagement";
import KeshiManagement from "./pages/KeshiManagement";
import Login from "./pages/Login";

function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-content">
        <Topbar />
        <main className="page">
          <Routes>
            <Route
              path="/"
              element={
                <RequireAuth
                  roles={[
                    "admin",
                    "pi",
                    "secretary",
                    "director",
                    "chief",
                    "viewer",
                  ]}
                >
                  <Home />
                </RequireAuth>
              }
            />
            <Route
              path="/application"
              element={
                <RequireAuth
                  roles={["admin", "pi", "secretary", "director", "chief"]}
                >
                  <Application />
                </RequireAuth>
              }
            />
            <Route
              path="/pi-records"
              element={
                <RequireAuth
                  roles={["admin", "secretary", "director", "chief"]}
                >
                  <PiRecords />
                </RequireAuth>
              }
            />
            <Route
              path="/specialties"
              element={
                <RequireAuth
                  roles={[
                    "admin",
                    "pi",
                    "secretary",
                    "director",
                    "chief",
                    "viewer",
                  ]}
                >
                  <Specialties />
                </RequireAuth>
              }
            />
            <Route
              path="/institution/team"
              element={
                <RequireAuth
                  roles={["admin", "pi", "secretary", "director", "chief"]}
                >
                  <InstitutionTeam />
                </RequireAuth>
              }
            />
            <Route
              path="/institution/files"
              element={
                <RequireAuth
                  roles={["admin", "secretary", "director", "chief"]}
                >
                  <InstitutionFiles />
                </RequireAuth>
              }
            />
            <Route
              path="/keshi"
              element={
                <RequireAuth
                  roles={[
                    "admin",
                    "pi",
                    "secretary",
                    "director",
                    "chief",
                    "viewer",
                  ]}
                >
                  <KeshiManagement />
                </RequireAuth>
              }
            />
            <Route
              path="/keshi/:id"
              element={
                <RequireAuth
                  roles={[
                    "admin",
                    "pi",
                    "secretary",
                    "director",
                    "chief",
                    "viewer",
                  ]}
                >
                  <KeshiManagement />
                </RequireAuth>
              }
            />
            <Route
              path="/keshi/:id/group/:groupId"
              element={
                <RequireAuth
                  roles={[
                    "admin",
                    "pi",
                    "secretary",
                    "director",
                    "chief",
                    "viewer",
                  ]}
                >
                  <KeshiManagement />
                </RequireAuth>
              }
            />
            <Route
              path="/publish-notice"
              element={
                <RequireAuth
                  roles={["admin", "secretary", "director", "chief"]}
                >
                  <PublishNotice />
                </RequireAuth>
              }
            />
            <Route
              path="/notice-group"
              element={
                <RequireAuth
                  roles={["admin", "secretary", "director", "chief"]}
                >
                  <NoticeGroupManagement />
                </RequireAuth>
              }
            />
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
