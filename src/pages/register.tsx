import React, { use, useState } from "react";
import { Link, TextField, Button, Container, Typography } from "@mui/material"
import { useNavigate } from "react-router-dom";

const Register = () => {

    const [email, setEmail] =  useState("");
    const [password,setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const navigate = useNavigate();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        if(password != confirmPassword) {
            alert("Passwords do not match");
            return;
        }
        console.log("Registering with", { email, password });
        navigate("/login")
    }

}