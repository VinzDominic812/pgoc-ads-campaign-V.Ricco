//import React from "react";
import { Link } from "@mui/material";
import { useNavigate } from "react-router-dom";

const Homepage = () => {
    const navigate = useNavigate();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
          <h1 className="text-3xl font-bold mb-6">Welcome to PGOC Campaign</h1>
          <div className="flex space-x-4">
            <Link
              component="button"
              variant="body1"
              onClick={() => navigate("/login")}
              sx={{ px: 3, py: 1, bgcolor: "blue.500", color: "white", borderRadius: 2 }}
            >
              Login
            </Link>
            <Link
              component="button"
              variant="body1"
              onClick={() => navigate("/register")}
              sx={{ px: 3, py: 1, bgcolor: "green.500", color: "white", borderRadius: 2 }}
            >
              Register
            </Link>
          </div>
        </div>
      );
    };

export default Homepage;