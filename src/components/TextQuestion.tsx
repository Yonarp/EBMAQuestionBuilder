import React from "react";
import { TextField } from "@mui/material";

export default function TextQuestion({ currentAnswer, questionKey, handleAnswerChange, textType }) {

    if (textType === "Text") {
        return (
            <TextField
                fullWidth
                placeholder="Enter your answer..."
                variant="outlined"
                size="small"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            />
        )
    }

    if (textType === "Number") {
        return (
            <TextField
                type="number"
                placeholder="Enter a number..."
                variant="outlined"
                size="small"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            />
        )
    }

    if (textType === "Email") {
        return (
            <TextField
                type="email"
                placeholder="Enter your email..."
                variant="outlined"
                size="small"
                fullWidth
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
            />
        )
    }

    if (textType === "Date") {
        return (
            <TextField
                type="date"
                variant="outlined"
                size="small"
                value={currentAnswer}
                onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
                InputLabelProps={{ shrink: true }}
            />
        )
    }
    
    // long text
    return (
        <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Enter your detailed answer..."
            variant="outlined"
            value={currentAnswer}
            onChange={(e) => handleAnswerChange(questionKey, e.target.value)}
        />
    )
}