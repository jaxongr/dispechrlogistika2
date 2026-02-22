import { useState } from "react";
import { Card, Row, Col, Typography, Form, InputNumber, Switch, Button, Divider, Space, message, Input, Select, Tooltip } from "antd";
import { SettingOutlined, DollarOutlined, StopOutlined, BellOutlined, SaveOutlined, InfoCircleOutlined, UndoOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface Prices { daily: number; weekly: number; monthly: number; }
interface BlockRules { enabled: boolean; maxSpam: number; timeWindow: number; duration: number; aiEnabled: boolean; aiThreshold: number; }
interface Notifs { admin: boolean; payment: boolean; block: boolean; session: boolean; dailyReport: boolean; reportTime: string; channel: "telegram" | "email" | "both"; }

const Settings: React.FC = () => {
  const [pForm] = Form.useForm<Prices>();
  const [bForm] = Form.useForm<BlockRules>();
  const [nForm] = Form.useForm<Notifs>();
  const [saving, setSaving] = useState(false);

  const doSave = async (msg: string) => {
    setSaving(true);
    try { await new Promise((r) => setTimeout(r, 800)); message.success(msg); }
    catch { message.error("Xatolik"); }
    finally { setSaving(false); }
  };

  const fmtN = (v: number | undefined) => (v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "");
  const parseN = (v: string | undefined) => Number(v?.replace(/,/g, "") || 0);

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><SettingOutlined style={{ marginRight: 8 }} />Sozlamalar</Title>
        <Text type="secondary">Tizim sozlamalari va konfiguratsiya</Text>
      </div>
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card title={<Space><DollarOutlined style={{ color: "#52c41a" }} /><span>Obuna narxlari</span></Space>} bordered={false} style={{ borderRadius: 12 }} extra={<Tooltip title="Mavjud obunalarga tasir qilmaydi"><InfoCircleOutlined style={{ color: "#8c8c8c" }} /></Tooltip>}>
            <Form<Prices> form={pForm} layout="vertical" initialValues={{ daily: 3000, weekly: 15000, monthly: 50000 }} onFinish={() => doSave("Narxlar saqlandi")}>
              <Form.Item name="daily" label="Kunlik (UZS)" rules={[{ required: true }]}><InputNumber min={0} step={1000} style={{ width: "100%" }} formatter={fmtN} parser={parseN} addonAfter="UZS" size="large" /></Form.Item>
              <Form.Item name="weekly" label="Haftalik (UZS)" rules={[{ required: true }]}><InputNumber min={0} step={1000} style={{ width: "100%" }} formatter={fmtN} parser={parseN} addonAfter="UZS" size="large" /></Form.Item>
              <Form.Item name="monthly" label="Oylik (UZS)" rules={[{ required: true }]}><InputNumber min={0} step={1000} style={{ width: "100%" }} formatter={fmtN} parser={parseN} addonAfter="UZS" size="large" /></Form.Item>
              <Divider />
              <Space><Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">Saqlash</Button><Button icon={<UndoOutlined />} onClick={() => pForm.resetFields()} size="large">Qaytarish</Button></Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title={<Space><StopOutlined style={{ color: "#ff4d4f" }} /><span>Avtobloklash qoidalari</span></Space>} bordered={false} style={{ borderRadius: 12 }}>
            <Form<BlockRules> form={bForm} layout="vertical" initialValues={{ enabled: true, maxSpam: 10, timeWindow: 5, duration: 24, aiEnabled: true, aiThreshold: 85 }} onFinish={() => doSave("Qoidalar saqlandi")}>
              <Form.Item name="enabled" label="Avtobloklash" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item>
              <Row gutter={16}>
                <Col span={12}><Form.Item name="maxSpam" label="Max spam" rules={[{ required: true }]}><InputNumber min={1} max={100} style={{ width: "100%" }} /></Form.Item></Col>
                <Col span={12}><Form.Item name="timeWindow" label="Vaqt (daq)" rules={[{ required: true }]}><InputNumber min={1} max={60} style={{ width: "100%" }} /></Form.Item></Col>
              </Row>
              <Form.Item name="duration" label="Bloklash (soat)" rules={[{ required: true }]}><InputNumber min={1} max={720} style={{ width: "100%" }} addonAfter="soat" /></Form.Item>
              <Divider orientation="left" plain><Text type="secondary">AI aniqlash</Text></Divider>
              <Form.Item name="aiEnabled" label="AI spam" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item>
              <Form.Item name="aiThreshold" label={<Space><span>Ishonch chegarasi</span><Tooltip title="Min foiz"><InfoCircleOutlined /></Tooltip></Space>} rules={[{ required: true }]}><InputNumber min={50} max={100} style={{ width: "100%" }} addonAfter="%" /></Form.Item>
              <Divider />
              <Space><Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">Saqlash</Button><Button icon={<UndoOutlined />} onClick={() => bForm.resetFields()} size="large">Qaytarish</Button></Space>
            </Form>
          </Card>
        </Col>
        <Col xs={24}>
          <Card title={<Space><BellOutlined style={{ color: "#1890ff" }} /><span>Bildirishnomalar</span></Space>} bordered={false} style={{ borderRadius: 12 }}>
            <Form<Notifs> form={nForm} layout="vertical" initialValues={{ admin: true, payment: true, block: true, session: true, dailyReport: true, reportTime: "09:00", channel: "telegram" }} onFinish={() => doSave("Sozlamalar saqlandi")}>
              <Row gutter={[24, 0]}>
                <Col xs={24} sm={12} md={6}><Form.Item name="admin" label="Admin" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
                <Col xs={24} sm={12} md={6}><Form.Item name="payment" label="Tolov" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
                <Col xs={24} sm={12} md={6}><Form.Item name="block" label="Bloklash" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
                <Col xs={24} sm={12} md={6}><Form.Item name="session" label="Sessiya" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
              </Row>
              <Divider />
              <Row gutter={[24, 0]}>
                <Col xs={24} sm={8}><Form.Item name="dailyReport" label="Kunlik hisobot" valuePropName="checked"><Switch checkedChildren="On" unCheckedChildren="Off" /></Form.Item></Col>
                <Col xs={24} sm={8}><Form.Item name="reportTime" label="Vaqt"><Input placeholder="09:00" /></Form.Item></Col>
                <Col xs={24} sm={8}><Form.Item name="channel" label="Kanal"><Select options={[{ value: "telegram", label: "Telegram" }, { value: "email", label: "Email" }, { value: "both", label: "Ikkalasi" }]} /></Form.Item></Col>
              </Row>
              <Divider />
              <Space><Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={saving} size="large">Saqlash</Button><Button icon={<UndoOutlined />} onClick={() => nForm.resetFields()} size="large">Qaytarish</Button></Space>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Settings;
