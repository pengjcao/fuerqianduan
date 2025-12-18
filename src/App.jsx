import { Route, Routes } from "react-router-dom";
import "./App.css";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import RequireAuth from "./components/RequireAuth";
import Home from "./pages/Home";
import Application from "./pages/Application";
import PiRecords from "./pages/PiRecords";
import Specialties from "./pages/Specialties";
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
                  roles={["admin", "pi", "secretary", "director", "chief"]}
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
            <Route path="/login" element={<Login />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
