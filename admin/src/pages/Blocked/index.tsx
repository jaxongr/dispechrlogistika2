import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Card, Tabs, Tag, Space, Typography, Button, Popconfirm, Input, message, Avatar, Empty, Badge } from "antd";
import { StopOutlined, CheckCircleOutlined, SearchOutlined, UserOutlined, RobotOutlined, ReloadOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { botUsersApi } from "../../api/endpoints";
import type { BotUser } from "../../types";

const { Title, Text } = Typography;

const Blocked: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [activeTab, setActiveTab] = useState("manual");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { data: blockedData, isLoading, refetch } = useQuery({
    queryKey: ["blocked-users", activeTab, currentPage, pageSize, searchText],
    queryFn: () => botUsersApi.list({ page: currentPage, limit: pageSize, isBlocked: true, blockType: activeTab, search: searchText || undefined }),
  });

  const unblockMutation = useMutation({
    mutationFn: (telegramId: string) => botUsersApi.unblock(telegramId),
    onSuccess: () => { message.success("Foydalanuvchi blokdan chiqarildi"); queryClient.invalidateQueries({ queryKey: ["blocked-users"] }); queryClient.invalidateQueries({ queryKey: ["bot-users"] }); },
    onError: () => { message.error("Blokdan chiqarishda xatolik yuz berdi"); },
  });

  const blockedUsers: BotUser[] = blockedData?.data?.data ?? [];
  const total = blockedData?.data?.total ?? 0;

  const getColumns = (blockType: string): ColumnsType<BotUser> => [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Telegram ID", dataIndex: "telegramId", key: "telegramId", width: 130, render: (id: string) => <Text copyable={{ text: id }} code style={{ fontSize: 12 }}>{id}</Text> },
    {
      title: "Foydalanuvchi", key: "user", width: 200,
      render: (_: unknown, record: BotUser) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#ff4d4f" }} />
          <div>
            <Text strong style={{ display: "block", lineHeight: 1.3 }}>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "\u2014"}</Text>
            {record.username && <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>}
          </div>
        </Space>
      ),
    },
    { title: "Telefon", dataIndex: "phone", key: "phone", width: 140, render: (phone?: string) => phone ? <Text>{phone}</Text> : <Text type="secondary">{"\u2014"}</Text> },
    {
      title: "Bloklash turi", key: "blockType", width: 140,
      render: () => blockType === "manual" ? <Tag color="red" icon={<UserOutlined />}>Qolda bloklangan</Tag> : <Tag color="volcano" icon={<RobotOutlined />}>AI tomonidan</Tag>,
    },
    { title: "Oxirgi faollik", dataIndex: "lastActiveAt", key: "lastActiveAt", width: 150, render: (date?: string) => date ? <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text> : <Text type="secondary">{"\u2014"}</Text> },
    { title: "Royxatdan otgan", dataIndex: "createdAt", key: "createdAt", width: 150, sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(), render: (date: string) => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text> },
    {
      title: "Amallar", key: "actions", width: 160, fixed: "right",
      render: (_: unknown, record: BotUser) => (
        <Popconfirm title="Blokdan chiqarish" description="Blokdan chiqarishni xohlaysizmi?" onConfirm={() => unblockMutation.mutate(record.telegramId)} okText="Ha" cancelText="Yoq">
          <Button type="primary" size="small" icon={<CheckCircleOutlined />} style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} loading={unblockMutation.isPending}>Blokdan chiqarish</Button>
        </Popconfirm>
      ),
    },
  ];

  const renderTable = (blockType: string) => (
    <Table<BotUser> columns={getColumns(blockType)} dataSource={blockedUsers} rowKey="id" loading={isLoading} pagination={{ current: currentPage, pageSize, total, onChange: (page) => setCurrentPage(page), showTotal: (t) => "Jami: " + t + " ta bloklangan" }} size="middle" scroll={{ x: 1050 }} locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={blockType === "manual" ? "Qolda bloklangan foydalanuvchilar yoq" : "AI tomonidan bloklangan foydalanuvchilar yoq"} /> }} />
  );

  const tabItems = [
    { key: "manual", label: <Space><StopOutlined /><span>Qolda bloklangan</span><Badge count={activeTab === "manual" ? total : 0} showZero={false} /></Space>, children: renderTable("manual") },
    { key: "ai", label: <Space><RobotOutlined /><span>AI tomonidan bloklangan</span><Badge count={activeTab === "ai" ? total : 0} showZero={false} /></Space>, children: renderTable("ai") },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><StopOutlined style={{ marginRight: 8, color: "#ff4d4f" }} />Bloklangan foydalanuvchilar</Title>
        <Text type="secondary">Qolda va AI tomonidan bloklangan foydalanuvchilar royxati</Text>
      </div>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }}>
          <Input placeholder="Qidirish: ism, username, telefon..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} style={{ width: 320 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Yangilash</Button>
        </Space>
        <Tabs activeKey={activeTab} onChange={(key) => { setActiveTab(key); setCurrentPage(1); }} items={tabItems} type="card" />
      </Card>
    </div>
  );
};

export default Blocked;
