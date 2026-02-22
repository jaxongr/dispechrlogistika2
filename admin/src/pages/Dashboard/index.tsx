import { useQuery } from "@tanstack/react-query";
import {
  Row, Col, Card, Statistic, Spin, Alert, Typography, Divider, Tag, Space, Progress,
} from "antd";
import {
  UserOutlined, CrownOutlined, DollarOutlined, ThunderboltOutlined,
  RiseOutlined, TeamOutlined, CheckCircleOutlined, StopOutlined,
} from "@ant-design/icons";
import { botUsersApi, subscriptionsApi, paymentsApi, vipApi } from "../../api/endpoints";
import type { DashboardStats } from "../../types";

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const { data: usersStats, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ["dashboard", "users-stats"],
    queryFn: () => botUsersApi.stats(),
    refetchInterval: 30000,
  });
  const { data: subsStats, isLoading: subsLoading, error: subsError } = useQuery({
    queryKey: ["dashboard", "subscriptions-stats"],
    queryFn: () => subscriptionsApi.stats(),
    refetchInterval: 30000,
  });
  const { data: payStats, isLoading: payLoading, error: payError } = useQuery({
    queryKey: ["dashboard", "payments-stats"],
    queryFn: () => paymentsApi.stats(),
    refetchInterval: 30000,
  });
  const { data: vipStats, isLoading: vipLoading, error: vipError } = useQuery({
    queryKey: ["dashboard", "vip-stats"],
    queryFn: () => vipApi.stats(),
    refetchInterval: 30000,
  });

  const isLoading = usersLoading || subsLoading || payLoading || vipLoading;
  const hasError = usersError || subsError || payError || vipError;
  const users: DashboardStats["users"] = usersStats?.data ?? { total: 0, active: 0, blocked: 0 };
  const subscriptions: DashboardStats["subscriptions"] = subsStats?.data ?? { total: 0, active: 0, byPlan: {} };
  const payments: DashboardStats["payments"] = payStats?.data ?? { total: 0, completed: 0, totalRevenue: 0 };
  const vip: DashboardStats["vip"] = vipStats?.data ?? { total: 0, active: 0, remaining: 0 };

  if (hasError) {
    return (
      <Alert
        message="Xatolik yuz berdi"
        description="Server bilan muammo yuz berdi."
        type="error"
        showIcon
        style={{ marginBottom: 24 }}
      />
    );
  }

  return (
    <Spin spinning={isLoading} size="large">
      <div style={{ padding: "0 0 24px" }}>
        <Title level={3} style={{ marginBottom: 4 }}>Boshqaruv paneli</Title>
        <Text type="secondary">Real vaqt statistikasi</Text>
      </div>
      <Row gutter={[20, 20]}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
            <Statistic title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>Jami foydalanuvchilar</span>} value={users.total} prefix={<UserOutlined style={{ color: "#fff" }} />} valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 32 }} />
            <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.2)" }} />
            <Space>
              <Tag color="green" icon={<CheckCircleOutlined />}>Faol: {users.active}</Tag>
              <Tag color="red" icon={<StopOutlined />}>Bloklangan: {users.blocked}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)" }}>
            <Statistic title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>Faol obunalar</span>} value={subscriptions.active} prefix={<ThunderboltOutlined style={{ color: "#fff" }} />} valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 32 }} />
            <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.2)" }} />
            <Tag color="blue">Jami: {subscriptions.total}</Tag>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}>
            <Statistic title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>Daromad</span>} value={payments.totalRevenue} prefix={<DollarOutlined style={{ color: "#fff" }} />} suffix="UZS" valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 28 }} />
            <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.2)" }} />
            <Space>
              <Tag color="green">Muvaffaqiyatli: {payments.completed}</Tag>
              <Tag color="default">Jami: {payments.total}</Tag>
            </Space>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" }}>
            <Statistic title={<span style={{ color: "rgba(255,255,255,0.85)", fontSize: 14 }}>VIP foydalanuvchilar</span>} value={vip.total} prefix={<CrownOutlined style={{ color: "#fff" }} />} valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 32 }} />
            <Divider style={{ margin: "12px 0", borderColor: "rgba(255,255,255,0.2)" }} />
            <Space>
              <Tag color="gold">Faol: {vip.active}</Tag>
              <Tag color="cyan">Qolgan: {vip.remaining}</Tag>
            </Space>
          </Card>
        </Col>
      </Row>
      <Row gutter={[20, 20]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title={<Space><RiseOutlined /><span>Obuna rejalar taqsimoti</span></Space>} bordered={false} style={{ borderRadius: 12 }}>
            {Object.entries(subscriptions.byPlan || {}).map(([plan, count]) => {
              const colors: Record<string, string> = { TRIAL: "#8c8c8c", DAILY: "#1890ff", WEEKLY: "#52c41a", MONTHLY: "#722ed1", GRANDFATHER: "#faad14" };
              const total = subscriptions.total || 1;
              const percent = Math.round(((count as number) / total) * 100);
              return (
                <div key={plan} style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <Tag color={colors[plan] || "default"}>{plan}</Tag>
                    <Text strong>{count as number} ({percent}%)</Text>
                  </div>
                  <Progress percent={percent} showInfo={false} strokeColor={colors[plan] || "#1890ff"} size="small" />
                </div>
              );
            })}
            {Object.keys(subscriptions.byPlan || {}).length === 0 && <Text type="secondary">Malumot mavjud emas</Text>}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<Space><TeamOutlined /><span>Tizim holati</span></Space>} bordered={false} style={{ borderRadius: 12 }}>
            <Row gutter={[16, 16]}>
              <Col span={12}><Statistic title="Faol foydalanuvchilar ulushi" value={users.total ? Math.round((users.active / users.total) * 100) : 0} suffix="%" valueStyle={{ color: "#52c41a" }} /></Col>
              <Col span={12}><Statistic title="Tolov muvaffaqiyat darajasi" value={payments.total ? Math.round((payments.completed / payments.total) * 100) : 0} suffix="%" valueStyle={{ color: "#1890ff" }} /></Col>
              <Col span={12}><Statistic title="VIP konvertatsiya" value={users.total ? Math.round((vip.active / users.total) * 100) : 0} suffix="%" valueStyle={{ color: "#faad14" }} /></Col>
              <Col span={12}><Statistic title="Bloklangan ulushi" value={users.total ? Math.round((users.blocked / users.total) * 100) : 0} suffix="%" valueStyle={{ color: "#ff4d4f" }} /></Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </Spin>
  );
};

export default Dashboard;
