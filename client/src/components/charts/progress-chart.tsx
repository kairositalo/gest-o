import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ProgressChartProps {
  data: Array<{
    name: string;
    uploads: number;
    aprovados: number;
    rejeitados: number;
  }>;
}

export function ProgressChart({ data }: ProgressChartProps) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="name" 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
            }}
          />
          <Legend />
          <Bar
            dataKey="uploads"
            name="Uploads"
            fill="hsl(207 90% 54%)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="aprovados"
            name="Aprovados"
            fill="hsl(142 76% 36%)"
            radius={[2, 2, 0, 0]}
          />
          <Bar
            dataKey="rejeitados"
            name="Rejeitados"
            fill="hsl(0 84% 60%)"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
