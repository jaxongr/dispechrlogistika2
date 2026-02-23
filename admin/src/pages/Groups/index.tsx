import { useState } from "react";
import { Table, Card, Tag, Space, Typography, Button, Input, Select, Tooltip, Badge } from "antd";
import { TeamOutlined, SearchOutlined, ReloadOutlined, LinkOutlined, DisconnectOutlined, MessageOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface TelegramGroup {
  id: number; chatId: string; title: string; memberCount: number;
  priority: "HIGH" | "MEDIUM" | "LOW"; sessionName: string | null;
  isActive: boolean; lastMessageAt: string | null; createdAt: string;
}

const placeholderGroups: TelegramGroup[] = [
  { id: 1, chatId: "-1001234567890", title: "Logistika Toshkent", memberCount: 12500, priority: "HIGH", sessionName: "session_1", isActive: true, lastMessageAt: "2026-02-22T10:30:00Z", createdAt: "2025-01-15T08:00:00Z" },
  { id: 2, chatId: "-1001234567891", title: "Yuk tashish Buxoro", memberCount: 8700, priority: "HIGH", sessionName: "session_1", isActive: true, lastMessageAt: "2026-02-22T09:45:00Z", createdAt: "2025-02-10T12:00:00Z" },
  { id: 3, chatId: "-1001234567892", title: "Logistika Fargona", memberCount: 6200, priority: "MEDIUM", sessionName: "session_2", isActive: true, lastMessageAt: "2026-02-22T08:15:00Z", createdAt: "2025-03-05T09:30:00Z" },
  { id: 4, chatId: "-1001234567893", title: "Ref transport", memberCount: 3400, priority: "MEDIUM", sessionName: "session_2", isActive: true, lastMessageAt: "2026-02-21T16:20:00Z", createdAt: "2025-04-20T14:00:00Z" },
  { id: 5, chatId: "-1001234567894", title: "Xalqaro logistika", memberCount: 15000, priority: "HIGH", sessionName: "session_3", isActive: true, lastMessageAt: "2026-02-22T07:00:00Z", createdAt: "2025-01-01T10:00:00Z" },
  { id: 6, chatId: "-1001234567895", title: "Logistika Namangan", memberCount: 4100, priority: "LOW", sessionName: null, isActive: false, lastMessageAt: "2026-02-18T11:30:00Z", createdAt: "2025-06-15T08:00:00Z" },
  { id: 7, chatId: "-1001234567896", title: "Logistika Andijon", memberCount: 5800, priority: "MEDIUM", sessionName: "session_3", isActive: true, lastMessageAt: "2026-02-22T06:45:00Z", createdAt: "2025-05-10T12:00:00Z" },
  { id: 8, chatId: "-1001234567897", title: "Maxsus texnika", memberCount: 2300, priority: "LOW", sessionName: null, isActive: false, lastMessageAt: "2026-02-15T14:00:00Z", createdAt: "2025-07-01T09:00:00Z" },
];

const sessions = ["session_1", "session_2", "session_3", "session_4", "session_5"];
const prConfig: Record<string, { color: string; label: string }> = { HIGH: { color: "red", label: "Yuqori" }, MEDIUM: { color: "orange", label: "Orta" }, LOW: { color: "default", label: "Past" } };

const Groups: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredData = placeholderGroups.filter((g) => {
    const ms = !searchText || g.title.toLowerCase().includes(searchText.toLowerCase()) || g.chatId.includes(searchText);
    const mp = priorityFilter === "all" || g.priority === priorityFilter;
    return ms && mp;
  });

  const columns: ColumnsType<TelegramGroup> = [
    { title: "Chat ID", dataIndex: "chatId", key: "chatId", width: 150, render: (v: string) => <Text copyable={{ text: v }} code style={{ fontSize: 11 }}>{v}</Text> },
    { title: "Guruh nomi", dataIndex: "title", key: "title", width: 200, sorter: (a, b) => a.title.localeCompare(b.title), render: (v: string) => <Text strong>{v}</Text> },
    { title: "Azolar", dataIndex: "memberCount", key: "memberCount", width: 100, sorter: (a, b) => a.memberCount - b.memberCount, render: (v: number) => <Space><TeamOutlined style={{ color: "#1890ff" }} /><Text>{new Intl.NumberFormat("uz-UZ").format(v)}</Text></Space> },
    { title: "Ustuvorlik", dataIndex: "priority", key: "priority", width: 110, filters: [{ text: "Yuqori", value: "HIGH" }, { text: "Orta", value: "MEDIUM" }, { text: "Past", value: "LOW" }], onFilter: (value, record) => record.priority === value, render: (v: string) => { const c = prConfig[v]; return c ? <Tag color={c.color}>{c.label}</Tag> : <Tag>{v}</Tag>; } },
    { title: "Sessiya", dataIndex: "sessionName", key: "sessionName", width: 160, render: (v: string | null, _r: TelegramGroup) => <Select value={v || undefined} placeholder="Tayinlash..." size="small" style={{ width: 140 }} allowClear onChange={() => {}} options={sessions.map((s) => ({ value: s, label: s }))} /> },
    { title: "Holat", dataIndex: "isActive", key: "isActive", width: 110, render: (v: boolean) => v ? <Badge status="success" text={<Text style={{ color: "#52c41a", fontSize: 13 }}>Faol</Text>} /> : <Badge status="default" text={<Text type="secondary" style={{ fontSize: 13 }}>Nofaol</Text>} /> },
    { title: "Oxirgi xabar", dataIndex: "lastMessageAt", key: "lastMessageAt", width: 160, sorter: (a, b) => dayjs(a.lastMessageAt || 0).unix() - dayjs(b.lastMessageAt || 0).unix(), defaultSortOrder: "descend", render: (v: string | null) => v ? <Tooltip title={dayjs(v).format("DD.MM.YYYY HH:mm:ss")}><Space><MessageOutlined style={{ color: "#8c8c8c" }} /><Text type="secondary" style={{ fontSize: 13 }}>{dayjs(v).format("DD.MM.YYYY HH:mm")}</Text></Space></Tooltip> : <Text type="secondary">{"\u2014"}</Text> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><TeamOutlined style={{ marginRight: 8 }} />Telegram guruhlar</Title>
        <Text type="secondary">Guruhlar royxati, sessiya tayinlash va monitoring</Text>
      </div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Tag color="blue" style={{ padding: "4px 12px", fontSize: 13 }}><LinkOutlined /> Jami: {placeholderGroups.length}</Tag>
        <Tag color="green" style={{ padding: "4px 12px", fontSize: 13 }}>Faol: {placeholderGroups.filter((g) => g.isActive).length}</Tag>
        <Tag color="default" style={{ padding: "4px 12px", fontSize: 13 }}><DisconnectOutlined /> Nofaol: {placeholderGroups.filter((g) => !g.isActive).length}</Tag>
      </Space>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            <Input placeholder="Qidirish..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} style={{ width: 300 }} allowClear />
            <Select value={priorityFilter} onChange={(v) => { setPriorityFilter(v); setCurrentPage(1); }} style={{ width: 160 }} options={[{ value: "all", label: "Barcha" }, { value: "HIGH", label: "Yuqori" }, { value: "MEDIUM", label: "Orta" }, { value: "LOW", label: "Past" }]} />
          </Space>
          <Button icon={<ReloadOutlined />}>Yangilash</Button>
        </Space>
        <Table<TelegramGroup> columns={columns} dataSource={filteredData} rowKey="id" pagination={{ current: currentPage, pageSize: 15, total: filteredData.length, onChange: (p) => setCurrentPage(p), showTotal: (t) => "Jami: " + t + " ta guruh" }} size="middle" scroll={{ x: 1100 }} />
      </Card>
    </div>
  );
};

export default Groups;
