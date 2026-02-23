import { useState } from "react";
import { Card, Row, Col, Tag, Space, Typography, Button, Badge, Statistic, Progress, Divider, List, Empty } from "antd";
import { ApiOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined, TeamOutlined, ClockCircleOutlined, ThunderboltOutlined, WarningOutlined } from "@ant-design/icons";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface SessionInfo {
  id: string; name: string; phone: string; status: "CONNECTED" | "DISCONNECTED" | "RECONNECTING";
  groupCount: number; maxGroups: number; messagesSent: number; messagesQueued: number;
  lastActivity: string | null; uptime: string; errors: number;
}

const sessions: SessionInfo[] = [
  { id: "1", name: "session_1", phone: "+998901111111", status: "CONNECTED", groupCount: 12, maxGroups: 20, messagesSent: 1456, messagesQueued: 3, lastActivity: "2026-02-22T10:30:00Z", uptime: "5 kun 12 soat", errors: 0 },
  { id: "2", name: "session_2", phone: "+998902222222", status: "CONNECTED", groupCount: 8, maxGroups: 20, messagesSent: 982, messagesQueued: 7, lastActivity: "2026-02-22T10:28:00Z", uptime: "3 kun 8 soat", errors: 2 },
  { id: "3", name: "session_3", phone: "+998903333333", status: "RECONNECTING", groupCount: 15, maxGroups: 20, messagesSent: 2103, messagesQueued: 45, lastActivity: "2026-02-22T09:15:00Z", uptime: "0 kun 2 soat", errors: 8 },
  { id: "4", name: "session_4", phone: "+998904444444", status: "DISCONNECTED", groupCount: 0, maxGroups: 20, messagesSent: 0, messagesQueued: 0, lastActivity: null, uptime: "\u2014", errors: 0 },
  { id: "5", name: "session_5", phone: "+998905555555", status: "CONNECTED", groupCount: 18, maxGroups: 20, messagesSent: 3210, messagesQueued: 1, lastActivity: "2026-02-22T10:32:00Z", uptime: "12 kun 6 soat", errors: 1 },
];

const sConf: Record<string, { color: string; badge: "success" | "error" | "processing"; label: string; icon: React.ReactNode }> = {
  CONNECTED: { color: "green", badge: "success", label: "Ulangan", icon: <CheckCircleOutlined /> },
  DISCONNECTED: { color: "red", badge: "error", label: "Uzilgan", icon: <CloseCircleOutlined /> },
  RECONNECTING: { color: "orange", badge: "processing", label: "Qayta ulanmoqda", icon: <ClockCircleOutlined /> },
};

const Sessions: React.FC = () => {
  const [_refreshKey, setRefreshKey] = useState(0);
  const connected = sessions.filter((s) => s.status === "CONNECTED").length;
  const totalGroups = sessions.reduce((a, s) => a + s.groupCount, 0);
  const totalQueued = sessions.reduce((a, s) => a + s.messagesQueued, 0);
  const totalSent = sessions.reduce((a, s) => a + s.messagesSent, 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><ApiOutlined style={{ marginRight: 8 }} />Sessiyalar monitoring</Title>
        <Text type="secondary">Telegram sessiyalar holati va xabarlar navbati</Text>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ borderRadius: 12 }}>
            <Statistic title="Jami sessiyalar" value={sessions.length} prefix={<ApiOutlined />} valueStyle={{ fontWeight: 600 }} />
            <div style={{ marginTop: 8 }}><Tag color="green">{connected} ulangan</Tag><Tag color="red">{sessions.filter((s) => s.status === "DISCONNECTED").length} uzilgan</Tag></div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Guruhlar" value={totalGroups} prefix={<TeamOutlined />} valueStyle={{ color: "#1890ff", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Navbatda" value={totalQueued} prefix={<ClockCircleOutlined />} valueStyle={{ color: totalQueued > 20 ? "#ff4d4f" : "#faad14", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Yuborilgan" value={totalSent} prefix={<ThunderboltOutlined />} valueStyle={{ color: "#52c41a", fontWeight: 600 }} /></Card></Col>
      </Row>
      <div style={{ marginBottom: 16, textAlign: "right" }}><Button icon={<ReloadOutlined />} onClick={() => setRefreshKey((k) => k + 1)}>Yangilash</Button></div>
      <Row gutter={[16, 16]}>
        {sessions.map((s) => {
          const c = sConf[s.status];
          const pct = Math.round((s.groupCount / s.maxGroups) * 100);
          return (
            <Col xs={24} md={12} lg={8} key={s.id}>
              <Card bordered={false} style={{ borderRadius: 12, borderLeft: "4px solid " + (s.status === "CONNECTED" ? "#52c41a" : s.status === "RECONNECTING" ? "#faad14" : "#ff4d4f") }}
                title={<Space><Badge status={c.badge} /><Text strong style={{ fontSize: 16 }}>{s.name}</Text></Space>}
                extra={<Tag color={c.color} icon={c.icon}>{c.label}</Tag>}>
                <Space direction="vertical" style={{ width: "100%" }} size="small">
                  <div style={{ display: "flex", justifyContent: "space-between" }}><Text type="secondary">Telefon:</Text><Text copyable>{s.phone}</Text></div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}><Text type="secondary">Ish vaqti:</Text><Text>{s.uptime}</Text></div>
                  <Divider style={{ margin: "8px 0" }} />
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><Text type="secondary"><TeamOutlined /> Guruhlar:</Text><Text strong>{s.groupCount} / {s.maxGroups}</Text></div>
                    <Progress percent={pct} size="small" strokeColor={pct > 80 ? "#ff4d4f" : "#1890ff"} status={pct > 80 ? "exception" : "active"} />
                  </div>
                  <Divider style={{ margin: "8px 0" }} />
                  <Row gutter={16}>
                    <Col span={12}><Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Yuborilgan</Text>} value={s.messagesSent} valueStyle={{ fontSize: 18, color: "#52c41a" }} /></Col>
                    <Col span={12}><Statistic title={<Text type="secondary" style={{ fontSize: 12 }}>Navbatda</Text>} value={s.messagesQueued} valueStyle={{ fontSize: 18, color: s.messagesQueued > 10 ? "#ff4d4f" : "#faad14" }} /></Col>
                  </Row>
                  {s.errors > 0 && <><Divider style={{ margin: "8px 0" }} /><Tag color="red" icon={<WarningOutlined />}>{s.errors} ta xatolik</Tag></>}
                  {s.lastActivity && <div style={{ marginTop: 4 }}><Text type="secondary" style={{ fontSize: 12 }}>Oxirgi: {dayjs(s.lastActivity).format("DD.MM.YYYY HH:mm")}</Text></div>}
                </Space>
              </Card>
            </Col>
          );
        })}
      </Row>
      {sessions.length === 0 && <Card bordered={false} style={{ borderRadius: 12, marginTop: 16 }}><Empty description="Sessiyalar topilmadi" /></Card>}
      {totalQueued > 0 && (
        <Card title={<Space><ClockCircleOutlined /><span>Navbat tafsilotlari</span></Space>} bordered={false} style={{ borderRadius: 12, marginTop: 24 }}>
          <List dataSource={sessions.filter((x) => x.messagesQueued > 0)} renderItem={(x) => (
            <List.Item actions={[<Tag color={x.messagesQueued > 10 ? "red" : "orange"} key="c">{x.messagesQueued} ta xabar</Tag>]}><List.Item.Meta title={x.name} description={"Tel: " + x.phone} /></List.Item>
          )} />
        </Card>
      )}
    </div>
  );
};

export default Sessions;
