import { useRoutes } from "react-router-dom";
import Home from "./pages/Home/Home";
import About from "./pages/About/About";
import Meeting from "./pages/Meeting/Meeting";
import CreateMeeting from "./pages/Meeting/CreateMeeting";
import Login from "./pages/Login";
import Register from "./pages/Register";

const AppRoutes = () => {
  return useRoutes([
    { path: "/", element: <Home /> },
    { path: "/about", element: <About /> },
    { path: "/create", element: <CreateMeeting /> },
    { path: "/meeting/:id", element: <Meeting /> },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
  ]);
};

export default AppRoutes;

        