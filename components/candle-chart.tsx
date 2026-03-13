"use client";

import {
  createChart,
  ColorType,
  IChartApi,
  ISeriesApi,
  CandlestickData as LW_CandlestickData,
  CandlestickSeries,
} from "lightweight-charts";
import React, { useEffect, useRef } from "react";

interface CandleChartProps {
  data: {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume?: number;
  }[];
}

export const CandleChart: React.FC<CandleChartProps> = ({ data }) => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#d1d5db",
      },
      grid: {
        vertLines: { color: "#27272a" },
        horzLines: { color: "#27272a" },
      },
      width: chartContainerRef.current.clientWidth,
      height: 400,
      timeScale: {
        borderColor: "#27272a",
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        mode: 0, // Normal
      },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#10b981",
      downColor: "#ef4444",
      wickUpColor: "#10b981",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!candleSeriesRef.current || !data) return;

    // Map data to lightweight-charts format (sorted by time)
    const formattedData: LW_CandlestickData[] = data
      .map((item) => ({
        time: (new Date(item.timestamp).getTime() / 1000) as any,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
      }))
      .sort((a, b) => (a.time as number) - (b.time as number));

    // Filter out duplicates (lightweight-charts doesn't like them)
    const uniqueData = formattedData.filter((item, index, self) => 
        index === 0 || item.time !== self[index-1].time
    );

    candleSeriesRef.current.setData(uniqueData);
    
    if (uniqueData.length > 0) {
        chartRef.current?.timeScale().fitContent();
    }
  }, [data]);

  return <div ref={chartContainerRef} className="w-full" style={{ position: 'relative' }} />;
};
