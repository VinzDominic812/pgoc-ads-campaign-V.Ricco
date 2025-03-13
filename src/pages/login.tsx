import React, { useState } from "react";
import { Link, TextField, Button, Container, Typography } from "@mui/material";
import { useNavigate} from "react-router-dom";

const Login = () => {
    const [email,setEmail] = useState("");
    const [password,setPassword] = useState("");
    const navigate = useNavigate();

    const handleLogin = async(e: React.FormEvent) => {
        e.preventDefault();
        console.log("Logging in with ", {email, password});
        navigate("/dashboard");
    }

    return (
        <Container maxWidth="xs">
            <Typography variant="h4" align="center" gutterBottom>
                Login
            </Typography>
            <form onSubmit={handleLogin}>
                <TextField
                label="Email"
                type="email"
                fullWidth
                margin="normal"
                value={email}
                onChange={(e) => setEmail (e.target.value)}/>
                <TextField 
                label={password}
                type="password"
                fullWidth
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                />
                <Button type="submit" fullWidth variant="contained" color="primary" sx={{ mt: 2 }}>
                    Login
                </Button>
            </form>
            <Typography align="center" mt={2}>
                Don't have an account?{" "}
                <Link component="button" onClick={()=> navigate("/register")} color="primary">
                Register
                </Link>
            </Typography>
        </Container>
    );
};

export default Login;