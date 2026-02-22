import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Card, Row, Col, Statistic, Tag, Space, Typography, Button, Select, Spin, Tooltip } from "antd";
import { DollarOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { paymentsApi } from "../../api/endpoints";
import type { Payment, PaginatedResponse, PlanType } from "../../types";

const { Title, Text } = Typography;
const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  COMPLETED: { color: "green", label: "Tolangan", icon: <CheckCircleOutlined /> },
  PENDING: { color: "orange", label: "Kutilmoqda", icon: <ClockCircleOutlined /> },
  FAILED: { color: "red", label: "Xatolik", icon: <CloseCircleOutlined /> },
  CANCELLED: { color: "default", label: "Bekor qilingan", icon: <ExclamationCircleOutlined /> },
};
const methodColors: Record<string, string> = { CLICK: "#00b0ff", PAYME: "#00c853", MANUAL: "#9e9e9e", REFERRAL: "#ff9800" };
const planLabels: Record<PlanType, string> = { TRIAL: "Sinov", DAILY: "Kunlik", WEEKLY: "Haftalik", MONTHLY: "Oylik", GRANDFATHER: "Doimiy" };

const Payments: React.FC = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["payments-stats"], queryFn: () => paymentsApi.stats() });
  const { data: listData, isLoading: listLoading, refetch } = useQuery({
    queryKey: ["payments-list", currentPage, pageSize, statusFilter],
    queryFn: () => paymentsApi.list({ page: currentPage, limit: pageSize, status: statusFilter === "all" ? undefined : statusFilter }),
  });

  const stats = statsData?.data ?? { total: 0, completed: 0, totalRevenue: 0, pending: 0, failed: 0 };
  const response: PaginatedResponse<Payment> = listData?.data ?? { data: [], total: 0, page: 1, limit: pageSize, totalPages: 0 };
  const formatCurrency = (amount: number) => new Intl.NumberFormat("uz-UZ").format(amount);

  const columns: ColumnsType<Payment> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60, sorter: (a, b) => a.id - b.id },
    { title: "Foydalanuvchi", key: "user", width: 180, render: (_: unknown, record: Payment) => (<div><Text strong>{record.user?.firstName || record.user?.username || "\u2014"}</Text><div><Text type="secondary" style={{ fontSize: 12 }}>ID: {record.telegramId}</Text></div></div>) },
    { title: "Reja", dataIndex: "planType", key: "planType", width: 110, filters: Object.entries(planLabels).map(([k, v]) => ({ text: v, value: k })), onFilter: (value, record) => record.planType === value, render: (plan: PlanType) => <Tag color="blue">{planLabels[plan] || plan}</Tag> },
    { title: "Summa", dataIndex: "amount", key: "amount", width: 130, sorter: (a, b) => a.amount - b.amount, render: (amount: number) => <Text strong style={{ fontSize: 14 }}>{formatCurrency(amount)} <Text type="secondary" style={{ fontSize: 12 }}>UZS</Text></Text> },
    { title: "Tolov usuli", dataIndex: "paymentMethod", key: "paymentMethod", width: 120, filters: [{ text: "Click", value: "CLICK" }, { text: "Payme", value: "PAYME" }, { text: "Manual", value: "MANUAL" }, { text: "Referral", value: "REFERRAL" }], onFilter: (value, record) => record.paymentMethod === value, render: (method: string) => <Tag color={methodColors[method] || "default"} style={{ fontWeight: 600 }}>{method}</Tag> },
    { title: "Holat", dataIndex: "status", key: "status", width: 140, render: (status: string) => { const config = statusConfig[status]; return config ? <Tag color={config.color} icon={config.icon}>{config.label}</Tag> : <Tag>{status}</Tag>; } },
    { title: "Sana", dataIndex: "createdAt", key: "createdAt", width: 160, sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(), defaultSortOrder: "descend", render: (date: string) => <Tooltip title={dayjs(date).format("DD.MM.YYYY HH:mm:ss")}><Text type="secondary" style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text></Tooltip> },
  ];

  return (
    <Spin spinning={statsLoading}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><DollarOutlined style={{ marginRight: 8 }} />Tolovlar</Title>
        <Text type="secondary">Barcha tolovlar tarixi va statistikasi</Text>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Jami daromad" value={stats.totalRevenue} prefix={<DollarOutlined />} suffix="UZS" valueStyle={{ color: "#52c41a", fontWeight: 700 }} formatter={(value) => formatCurrency(value as number)} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Muvaffaqiyatli" value={stats.completed} prefix={<CheckCircleOutlined />} valueStyle={{ color: "#52c41a", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Kutilmoqda" value={stats.pending || 0} prefix={<ClockCircleOutlined />} valueStyle={{ color: "#faad14", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Jami tolovlar" value={stats.total} prefix={<DollarOutlined />} valueStyle={{ color: "#1890ff", fontWeight: 600 }} /></Card></Col>
      </Row>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
          <Select value={statusFilter} onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }} style={{ width: 180 }} options={[{ value: "all", label: "Barcha holatlar" }, { value: "COMPLETED", label: "Tolangan" }, { value: "PENDING", label: "Kutilmoqda" }, { value: "FAILED", label: "Xatolik" }, { value: "CANCELLED", label: "Bekor qilingan" }]} />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Yangilash</Button>
        </Space>
        <Table<Payment> columns={columns} dataSource={response.data} rowKey="id" loading={listLoading} pagination={{ current: currentPage, pageSize, total: response.total, onChange: (page, size) => { setCurrentPage(page); setPageSize(size); }, showSizeChanger: true, pageSizeOptions: ["10", "15", "25", "50"], showTotal: (total) => "Jami: " + total + " ta tolov" }} size="middle" scroll={{ x: 950 }} />
      </Card>
    </Spin>
  );
};

export default Payments;
