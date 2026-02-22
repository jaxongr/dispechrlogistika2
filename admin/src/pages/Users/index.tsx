import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table, Card, Input, Tag, Space, Button, Typography, Popconfirm, Select, message, Tooltip, Avatar,
} from "antd";
import {
  SearchOutlined, UserOutlined, StopOutlined, CheckCircleOutlined, ReloadOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { botUsersApi } from "../../api/endpoints";
import type { BotUser, PaginatedResponse } from "../../types";

const { Title, Text } = Typography;

const Users: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchText, setSearchText] = useState("");
  const [blockedFilter, setBlockedFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["bot-users", currentPage, pageSize, searchText, blockedFilter],
    queryFn: () => botUsersApi.list({ page: currentPage, limit: pageSize, search: searchText || undefined, isBlocked: blockedFilter === "all" ? undefined : blockedFilter === "blocked" }),
  });

  const blockMutation = useMutation({
    mutationFn: (telegramId: string) => botUsersApi.block(telegramId),
    onSuccess: () => { message.success("Foydalanuvchi bloklandi"); queryClient.invalidateQueries({ queryKey: ["bot-users"] }); },
    onError: () => { message.error("Bloklashda xatolik yuz berdi"); },
  });

  const unblockMutation = useMutation({
    mutationFn: (telegramId: string) => botUsersApi.unblock(telegramId),
    onSuccess: () => { message.success("Foydalanuvchi blokdan chiqarildi"); queryClient.invalidateQueries({ queryKey: ["bot-users"] }); },
    onError: () => { message.error("Blokdan chiqarishda xatolik yuz berdi"); },
  });

  const response: PaginatedResponse<BotUser> = data?.data ?? { data: [], total: 0, page: 1, limit: pageSize, totalPages: 0 };

  const columns: ColumnsType<BotUser> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60, sorter: (a, b) => a.id - b.id },
    { title: "Telegram ID", dataIndex: "telegramId", key: "telegramId", width: 130, render: (id: string) => <Text copyable={{ text: id }} code style={{ fontSize: 12 }}>{id}</Text> },
    {
      title: "Ism", key: "name", width: 180,
      render: (_: unknown, record: BotUser) => (
        <Space>
          <Avatar size="small" icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
          <div>
            <Text strong style={{ display: "block", lineHeight: 1.3 }}>{[record.firstName, record.lastName].filter(Boolean).join(" ") || "\u2014"}</Text>
            {record.username && <Text type="secondary" style={{ fontSize: 12 }}>@{record.username}</Text>}
          </div>
        </Space>
      ),
    },
    { title: "Telefon", dataIndex: "phone", key: "phone", width: 140, render: (phone?: string) => phone ? <Text copyable={{ text: phone }}>{phone}</Text> : <Text type="secondary">{"\u2014"}</Text> },
    { title: "Holat", dataIndex: "isBlocked", key: "isBlocked", width: 120, render: (isBlocked: boolean) => isBlocked ? <Tag color="red" icon={<StopOutlined />}>Bloklangan</Tag> : <Tag color="green" icon={<CheckCircleOutlined />}>Faol</Tag> },
    {
      title: "Oxirgi faollik", dataIndex: "lastActiveAt", key: "lastActiveAt", width: 150,
      sorter: (a, b) => dayjs(a.lastActiveAt || 0).unix() - dayjs(b.lastActiveAt || 0).unix(),
      render: (date?: string) => date ? <Tooltip title={dayjs(date).format("DD.MM.YYYY HH:mm:ss")}><Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text></Tooltip> : <Text type="secondary">{"\u2014"}</Text>,
    },
    {
      title: "Royxatdan otgan", dataIndex: "createdAt", key: "createdAt", width: 150,
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(), defaultSortOrder: "descend",
      render: (date: string) => <Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text>,
    },
    {
      title: "Amallar", key: "actions", width: 130, fixed: "right",
      render: (_: unknown, record: BotUser) => record.isBlocked ? (
        <Popconfirm title="Blokdan chiqarish" description="Blokdan chiqarishni xohlaysizmi?" onConfirm={() => unblockMutation.mutate(record.telegramId)} okText="Ha" cancelText="Yoq">
          <Button type="link" size="small" icon={<CheckCircleOutlined />} style={{ color: "#52c41a" }} loading={unblockMutation.isPending}>Ochish</Button>
        </Popconfirm>
      ) : (
        <Popconfirm title="Bloklash" description="Bloklashni xohlaysizmi?" onConfirm={() => blockMutation.mutate(record.telegramId)} okText="Ha" cancelText="Yoq" okButtonProps={{ danger: true }}>
          <Button type="link" size="small" danger icon={<StopOutlined />} loading={blockMutation.isPending}>Bloklash</Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><UserOutlined style={{ marginRight: 8 }} />Foydalanuvchilar</Title>
        <Text type="secondary">Bot foydalanuvchilari royxati va boshqaruvi</Text>
      </div>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
          <Space wrap>
            <Input placeholder="Qidirish: ism, username, telefon..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} style={{ width: 320 }} allowClear />
            <Select value={blockedFilter} onChange={(value) => { setBlockedFilter(value); setCurrentPage(1); }} style={{ width: 160 }} options={[{ value: "all", label: "Barchasi" }, { value: "active", label: "Faol" }, { value: "blocked", label: "Bloklangan" }]} />
          </Space>
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Yangilash</Button>
        </Space>
        <Table<BotUser> columns={columns} dataSource={response.data} rowKey="id" loading={isLoading} pagination={{ current: currentPage, pageSize, total: response.total, onChange: (page, size) => { setCurrentPage(page); setPageSize(size); }, showSizeChanger: true, pageSizeOptions: ["10", "15", "25", "50"], showTotal: (total) => "Jami: " + total + " ta foydalanuvchi" }} size="middle" scroll={{ x: 1100 }} />
      </Card>
    </div>
  );
};

export default Users;
