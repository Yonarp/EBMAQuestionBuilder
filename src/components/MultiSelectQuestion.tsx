import React from "react";
import { 
    FormControl,
    FormLabel,
    FormControlLabel,
    Checkbox,
    Box
} from "@mui/material";

export default function MultiSelectQuestion({ question, currentAnswer, questionKey, handleCheckboxChange }) {
    const isHorizontal = question.Orientation?.toLowerCase() === "horizontal";

    return (
        <FormControl component="fieldset">
            <FormLabel component="legend">Select all that apply:</FormLabel>
            <Box
                sx={{
                    display: "flex",
                    flexDirection: isHorizontal ? "row" : "column",
                    flexWrap: isHorizontal ? "wrap" : "nowrap",
                    gap: isHorizontal ? 1 : 0,
                    mt: 1
                }}
            >
                {question.Options?.map((option: any) => (
                    <FormControlLabel
                        key={option.key}
                        control={
                            <Checkbox
                                checked={(currentAnswer || []).includes(option.key)}
                                onChange={() => {
                                    handleCheckboxChange(questionKey, option.key, Boolean(option.isExclusive), question.Options)
                                }}
                            />
                        }
                        label={<div dangerouslySetInnerHTML={{ __html: option.text }} />}
                        sx={isHorizontal ? {
                            minWidth: "fit-content",
                            marginRight: 2,
                            marginBottom: 0
                        } : {}}
                    />
                ))}
            </Box>
        </FormControl>
    )
}