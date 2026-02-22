import { useState, useMemo } from "react";
import {
  Table, Card, Input, Tag, Space, Typography, Button, Tooltip,
} from "antd";
import {
  SearchOutlined, ReloadOutlined, NotificationOutlined, EyeOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const { Title, Text, Paragraph } = Typography;

interface PostMessage {
  id: number;
  senderName: string;
  senderPhone: string;
  text: string;
  groupTitle: string;
  status: "SENT" | "PENDING" | "FAILED" | "MODERATION";
  createdAt: string;
}

const placeholderData: PostMessage[] = [
  { id: 1, senderName: "Alisher Navoiy", senderPhone: "+998901234567", text: "Toshkent-Samarqand yunalishi boyicha yuk tashish xizmati. 20 tonnagacha yuk qabul qilinadi.", groupTitle: "Logistika Toshkent", status: "SENT", createdAt: "2026-02-22T10:30:00Z" },
  { id: 2, senderName: "Bobur Mirzo", senderPhone: "+998911234567", text: "Buxoro viloyatidan Toshkentga qaytish yolida bosh mashina bor.", groupTitle: "Yuk tashish - Buxoro", status: "SENT", createdAt: "2026-02-22T09:15:00Z" },
  { id: 3, senderName: "Shuhrat Karimov", senderPhone: "+998931234567", text: "Fargona-Toshkent marshruti. Har kuni qatnov. Arzon narxlarda.", groupTitle: "Logistika Fargona", status: "PENDING", createdAt: "2026-02-22T08:45:00Z" },
  { id: 4, senderName: "Dilshod Rahimov", senderPhone: "+998941234567", text: "Ref mashina ijaraga beriladi. Sovuq zanjir xizmati.", groupTitle: "Ref transport", status: "MODERATION", createdAt: "2026-02-21T16:20:00Z" },
  { id: 5, senderName: "Nodir Ismoilov", senderPhone: "+998951234567", text: "Xalqaro yuk tashish - Ozbekiston-Qozogiston yunalishi.", groupTitle: "Xalqaro logistika", status: "FAILED", createdAt: "2026-02-21T14:00:00Z" },
  { id: 6, senderName: "Javohir Usmonov", senderPhone: "+998971234567", text: "Namangan shahridan qurilish materiallari tashish uchun transport kerak.", groupTitle: "Logistika Namangan", status: "SENT", createdAt: "2026-02-21T11:30:00Z" },
  { id: 7, senderName: "Rustam Qodirov", senderPhone: "+998881234567", text: "Andijon-Toshkent. Mebel tashish uchun yopiq kuzovli mashina.", groupTitle: "Logistika Andijon", status: "SENT", createdAt: "2026-02-20T15:45:00Z" },
  { id: 8, senderName: "Sardor Aliyev", senderPhone: "+998891234567", text: "Samarqand viloyatida kran xizmati. 25 tonnagacha kotarish imkoniyati.", groupTitle: "Maxsus texnika", status: "PENDING", createdAt: "2026-02-20T10:00:00Z" },
];

const Posts: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const statusConfig: Record<string, { color: string; label: string }> = {
    SENT: { color: "green", label: "Yuborilgan" },
    PENDING: { color: "orange", label: "Kutilmoqda" },
    FAILED: { color: "red", label: "Xatolik" },
    MODERATION: { color: "blue", label: "Moderatsiya" },
  };

  const filteredData = useMemo(() => {
    if (!searchText) return placeholderData;
    const lower = searchText.toLowerCase();
    return placeholderData.filter(
      (item) =>
        item.senderName.toLowerCase().includes(lower) ||
        item.senderPhone.includes(lower) ||
        item.text.toLowerCase().includes(lower) ||
        item.groupTitle.toLowerCase().includes(lower)
    );
  }, [searchText]);

  const columns: ColumnsType<PostMessage> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60, sorter: (a, b) => a.id - b.id },
    { title: "Yuboruvchi", dataIndex: "senderName", key: "senderName", width: 160, render: (name: string) => <Text strong>{name}</Text> },
    { title: "Telefon", dataIndex: "senderPhone", key: "senderPhone", width: 140, render: (phone: string) => <Text copyable={{ text: phone }}>{phone}</Text> },
    {
      title: "Matn", dataIndex: "text", key: "text", ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text} placement="topLeft">
          <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0, maxWidth: 300, fontSize: 13 }}>{text}</Paragraph>
        </Tooltip>
      ),
    },
    { title: "Guruh", dataIndex: "groupTitle", key: "groupTitle", width: 170, render: (title: string) => <Tag color="blue">{title}</Tag> },
    {
      title: "Holat", dataIndex: "status", key: "status", width: 130,
      filters: [{ text: "Yuborilgan", value: "SENT" }, { text: "Kutilmoqda", value: "PENDING" }, { text: "Xatolik", value: "FAILED" }, { text: "Moderatsiya", value: "MODERATION" }],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => {
        const config = statusConfig[status];
        return config ? <Tag color={config.color}>{config.label}</Tag> : <Tag>{status}</Tag>;
      },
    },
    {
      title: "Sana", dataIndex: "createdAt", key: "createdAt", width: 160,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
      defaultSortOrder: "descend",
      render: (date: string) => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text>,
    },
    { title: "", key: "actions", width: 50, render: () => <Tooltip title="Batafsil"><Button type="text" icon={<EyeOutlined />} size="small" /></Tooltip> },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><NotificationOutlined style={{ marginRight: 8 }} />Elonlar</Title>
        <Text type="secondary">Guruhlardan yuborilgan barcha xabarlar</Text>
      </div>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
          <Input placeholder="Qidirish: ism, telefon, matn, guruh..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} style={{ width: 360 }} allowClear />
          <Button icon={<ReloadOutlined />}>Yangilash</Button>
        </Space>
        <Table<PostMessage> columns={columns} dataSource={filteredData} rowKey="id" pagination={{ current: currentPage, pageSize, total: filteredData.length, onChange: (page) => setCurrentPage(page), showSizeChanger: false, showTotal: (total) => "Jami: " + total + " ta elon" }} size="middle" scroll={{ x: 900 }} />
      </Card>
    </div>
  );
};

export default Posts;
