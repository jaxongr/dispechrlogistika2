import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Card, Row, Col, Statistic, Tag, Space, Typography, Button, Spin, Select } from "antd";
import { ThunderboltOutlined, ReloadOutlined, ClockCircleOutlined, CalendarOutlined, CrownOutlined, GiftOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { subscriptionsApi } from "../../api/endpoints";
import type { Subscription, PlanType } from "../../types";

const { Title, Text } = Typography;
const planLabels: Record<PlanType, string> = { TRIAL: "Sinov", DAILY: "Kunlik", WEEKLY: "Haftalik", MONTHLY: "Oylik", GRANDFATHER: "Doimiy" };
const planColors: Record<PlanType, string> = { TRIAL: "default", DAILY: "blue", WEEKLY: "cyan", MONTHLY: "purple", GRANDFATHER: "gold" };
const planIcons: Record<PlanType, React.ReactNode> = { TRIAL: <GiftOutlined />, DAILY: <ClockCircleOutlined />, WEEKLY: <CalendarOutlined />, MONTHLY: <CalendarOutlined />, GRANDFATHER: <CrownOutlined /> };

interface SubscriptionRow extends Subscription { userId?: number; userTelegramId?: string; userName?: string; }

const Subscriptions: React.FC = () => {
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["subscriptions-stats"], queryFn: () => subscriptionsApi.stats() });
  const { data: expiringData, isLoading: expiringLoading, refetch } = useQuery({ queryKey: ["subscriptions-expiring"], queryFn: () => subscriptionsApi.expiring(3) });

  const stats = statsData?.data ?? { total: 0, active: 0, byPlan: {} };
  const expiringList: SubscriptionRow[] = expiringData?.data ?? [];
  const byPlan: Record<string, number> = stats.byPlan || {};

  const columns: ColumnsType<SubscriptionRow> = [
    { title: "ID", dataIndex: "id", key: "id", width: 60, sorter: (a, b) => a.id - b.id },
    {
      title: "Foydalanuvchi", key: "user", width: 180,
      render: (_: unknown, record: SubscriptionRow) => (<div><Text strong>{record.userName || "\u2014"}</Text>{record.userTelegramId && <div><Text type="secondary" style={{ fontSize: 12 }}>ID: {record.userTelegramId}</Text></div>}</div>),
    },
    {
      title: "Reja", dataIndex: "planType", key: "planType", width: 130,
      filters: Object.entries(planLabels).map(([key, label]) => ({ text: label, value: key })),
      onFilter: (value, record) => record.planType === value,
      render: (plan: PlanType) => <Tag color={planColors[plan]} icon={planIcons[plan]}>{planLabels[plan]}</Tag>,
    },
    { title: "Boshlanish", dataIndex: "startDate", key: "startDate", width: 150, sorter: (a, b) => dayjs(a.startDate).unix() - dayjs(b.startDate).unix(), render: (date: string) => <Text style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text> },
    {
      title: "Tugash", dataIndex: "endDate", key: "endDate", width: 180, sorter: (a, b) => dayjs(a.endDate).unix() - dayjs(b.endDate).unix(),
      render: (date: string) => {
        const isExpiring = dayjs(date).diff(dayjs(), "day") <= 3;
        const isExpired = dayjs(date).isBefore(dayjs());
        return (<Space><Text type={isExpired ? "danger" : isExpiring ? "warning" : undefined} style={{ fontSize: 13 }}>{dayjs(date).format("DD.MM.YYYY HH:mm")}</Text>{isExpired && <Tag color="red">Tugagan</Tag>}{!isExpired && isExpiring && <Tag color="orange">Tugayapti</Tag>}</Space>);
      },
    },
    { title: "Holat", dataIndex: "isActive", key: "isActive", width: 110, render: (isActive: boolean) => isActive ? <Tag color="green">Faol</Tag> : <Tag color="default">Nofaol</Tag> },
  ];

  return (
    <Spin spinning={statsLoading}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><ThunderboltOutlined style={{ marginRight: 8 }} />Obunalar</Title>
        <Text type="secondary">Obuna rejalari statistikasi va boshqaruvi</Text>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Jami obunalar" value={stats.total} prefix={<ThunderboltOutlined />} valueStyle={{ color: "#1890ff", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Faol obunalar" value={stats.active} prefix={<ThunderboltOutlined />} valueStyle={{ color: "#52c41a", fontWeight: 600 }} /></Card></Col>
        {Object.entries(byPlan).slice(0, 2).map(([plan, count]) => (<Col xs={24} sm={12} md={6} key={plan}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title={planLabels[plan as PlanType] || plan} value={count} prefix={planIcons[plan as PlanType]} valueStyle={{ fontWeight: 600 }} /></Card></Col>))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {Object.entries(byPlan).map(([plan, count]) => (<Col key={plan}><Tag color={planColors[plan as PlanType] || "default"} style={{ padding: "4px 12px", fontSize: 14 }}>{planLabels[plan as PlanType] || plan}: {count}</Tag></Col>))}
      </Row>
      <Card title={<Space><ClockCircleOutlined /><span>Tugashi yaqin obunalar (3 kun ichida)</span></Space>} bordered={false} style={{ borderRadius: 12 }} extra={<Space><Select value={planFilter} onChange={(val) => { setPlanFilter(val); setCurrentPage(1); }} style={{ width: 140 }} options={[{ value: "all", label: "Barcha rejalar" }, ...Object.entries(planLabels).map(([k, v]) => ({ value: k, label: v }))]} /><Button icon={<ReloadOutlined />} onClick={() => refetch()}>Yangilash</Button></Space>}>
        <Table<SubscriptionRow> columns={columns} dataSource={planFilter === "all" ? expiringList : expiringList.filter((s) => s.planType === planFilter)} rowKey="id" loading={expiringLoading} pagination={{ current: currentPage, pageSize, onChange: (page) => setCurrentPage(page), showTotal: (total) => "Jami: " + total + " ta obuna" }} size="middle" scroll={{ x: 800 }} />
      </Card>
    </Spin>
  );
};

export default Subscriptions;
