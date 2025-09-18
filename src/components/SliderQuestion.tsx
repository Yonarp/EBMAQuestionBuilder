import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Slider
} from "@mui/material";

export const SliderQuestion = ({ question, initialValue, onCommitAnswer }) => {
    const min = Number(question.MinRange ?? 1);
    const max = Number(question.MaxRange ?? 10);
    const leftAnchor = question.LeftAnchor;
    const rightAnchor = question.RightAnchor;
    const showSliderValue = Boolean(parseInt(question.ShowSliderValue));
    const isVertical = question.Orientation?.toLowerCase() === "vertical";
    const defaultValue = min;
    const [sliderValue, setSliderValue] = useState(
        typeof initialValue === "number" ? initialValue : defaultValue
    );

    useEffect(() => {
        const newInitialValue =
            typeof initialValue === "number" ? initialValue : defaultValue;
        setSliderValue(newInitialValue);
    }, [initialValue, defaultValue]);

    const handleSliderChange = (_: any, newValue: any) => {
        setSliderValue(newValue);
    };

    const handleSliderCommit = (_: any, finalValue: any) => {
        onCommitAnswer(finalValue);
    };

    return (
        <Box sx={{
            px: 2,
            display: isVertical ? "flex" : "block",
            flexDirection: isVertical ? "row" : "column",
            alignItems: isVertical ? "center" : "stretch",
            gap: isVertical ? 2 : 0
        }}>
            {showSliderValue ?
            <Typography variant="body2" gutterBottom={!isVertical}>
                Rate from {min} to {max}
            </Typography>
            : null}

            {/* Horizontal layout: anchors above slider */}
            {!isVertical && (leftAnchor || rightAnchor) && (
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                        px: 1
                    }}
                >
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            fontWeight: "medium",
                            textAlign: "left",
                            visibility: leftAnchor ? "visible" : "hidden"
                        }}
                    >
                        {leftAnchor || ""}
                    </Typography>
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            fontWeight: "medium",
                            textAlign: "right",
                            visibility: rightAnchor ? "visible" : "hidden"
                        }}
                    >
                        {rightAnchor || ""}
                    </Typography>
                </Box>
            )}

            {/* Vertical layout: Container for slider and anchors */}
            {isVertical ? (
                <Box sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    height: "300px"
                }}>
                    {/* Right anchor at the top */}
                    {rightAnchor && (
                        <Box sx={{
                            mb: 1,
                            textAlign: "center",
                            ml: "30px"
                        }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: "medium"
                                }}
                            >
                                {rightAnchor}
                            </Typography>
                        </Box>
                    )}

                    {/* Slider in the middle */}
                    <Box sx={{ flex: 1, display: "flex", alignItems: "center" }}>
                        <Slider
                            orientation="vertical"
                            sx={{
                                height: "250px",
                                "& .MuiSlider-markLabel": {
                                    transform: "translateX(-150%)",
                                    fontSize: "0.85em",
                                    whiteSpace: "nowrap"
                                }
                            }}
                            value={sliderValue}
                            onChange={handleSliderChange}
                            onChangeCommitted={handleSliderCommit}
                            step={1}
                            min={min}
                            max={max}
                            valueLabelDisplay={showSliderValue ? "auto" : "off"}
                            marks={showSliderValue ? [
                                {
                                    value: min,
                                    label: question.MinRangeText
                                        ? `${min} – ${question.MinRangeText}`
                                        : min.toString(),
                                },
                                {
                                    value: max,
                                    label: question.MaxRangeText
                                        ? `${max} – ${question.MaxRangeText}`
                                        : max.toString(),
                                },
                            ] : null}
                        />
                    </Box>

                    {/* Left anchor at the bottom */}
                    {leftAnchor && (
                        <Box sx={{
                            mt: 1,
                            textAlign: "center"
                        }}>
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                    fontWeight: "medium"
                                }}
                            >
                                {leftAnchor}
                            </Typography>
                        </Box>
                    )}
                </Box>
            ) : (
                /* Horizontal layout: existing slider setup */
                <Box sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center"
                }}>
                    <Slider
                        orientation="horizontal"
                        sx={{
                            "& .MuiSlider-markLabel": {
                                display: "inline-block !important",
                                width: "120px !important",
                                whiteSpace: "normal !important",
                                wordBreak: "break-word !important",
                                fontSize: "0.85em",
                                lineHeight: 1.2,
                                overflowWrap: "break-word",
                                textAlign: "center",
                            },
                            "& .MuiSlider-markLabel[data-index='0']": {
                                textAlign: "center",
                            },
                            "& .MuiSlider-markLabel[data-index='1']": {
                                transform: "translateX(-100%)",
                                textAlign: "right",
                            }
                        }}
                        value={sliderValue}
                        onChange={handleSliderChange}
                        onChangeCommitted={handleSliderCommit}
                        step={1}
                        min={min}
                        max={max}
                        valueLabelDisplay={showSliderValue ? "auto" : "off"}
                        marks={showSliderValue ? [
                            {
                                value: min,
                                label: question.MinRangeText
                                    ? `${min} – ${question.MinRangeText}`
                                    : min.toString(),
                            },
                            {
                                value: max,
                                label: question.MaxRangeText
                                    ? `${max} – ${question.MaxRangeText}`
                                    : max.toString(),
                            },
                        ] : null}
                    />
                </Box>
            )}

            {showSliderValue && (
                <Box sx={{
                    textAlign: "center",
                    mt: isVertical ? 0 : 1,
                    ml: isVertical ? 2 : 0
                }}>
                    <Typography variant="body2" color="primary">
                        Current value: {sliderValue}
                    </Typography>
                </Box>
            )}
        </Box>
    );
};