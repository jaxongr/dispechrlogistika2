import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Table, Card, Row, Col, Statistic, Tag, Space, Typography, Button, Input, Spin, Tooltip, Avatar } from "antd";
import { CrownOutlined, SearchOutlined, ReloadOutlined, DollarOutlined, UserOutlined, StarOutlined, TeamOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { vipApi } from "../../api/endpoints";
import type { VipUser, PaginatedResponse } from "../../types";

const { Title, Text } = Typography;

const Vip: React.FC = () => {
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  const { data: statsData, isLoading: statsLoading } = useQuery({ queryKey: ["vip-stats"], queryFn: () => vipApi.stats() });
  const { data: listData, isLoading: listLoading, refetch } = useQuery({
    queryKey: ["vip-list", currentPage, pageSize, searchText],
    queryFn: () => vipApi.list({ page: currentPage, limit: pageSize, search: searchText || undefined }),
  });

  const stats = statsData?.data ?? { total: 0, active: 0, remaining: 0, totalEarnings: 0 };
  const response: PaginatedResponse<VipUser> = listData?.data ?? { data: [], total: 0, page: 1, limit: pageSize, totalPages: 0 };
  const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(n);

  const columns: ColumnsType<VipUser> = [
    { title: "VIP kod", dataIndex: "vipCode", key: "vipCode", width: 140, render: (c: string) => <Space><CrownOutlined style={{ color: "#faad14" }} /><Text copyable={{ text: c }} strong style={{ color: "#faad14", fontFamily: "monospace" }}>{c}</Text></Space> },
    { title: "Foydalanuvchi", key: "user", width: 200, render: (_: unknown, r: VipUser) => (<Space><Avatar size="small" icon={<CrownOutlined />} style={{ backgroundColor: "#faad14" }} /><div><Text strong style={{ display: "block", lineHeight: 1.3 }}>{r.user?.firstName || r.user?.username || "\u2014"}</Text><Text type="secondary" style={{ fontSize: 12 }}>ID: {r.telegramId}</Text></div></Space>) },
    { title: "Holat", dataIndex: "isActive", key: "isActive", width: 110, filters: [{ text: "Faol", value: true }, { text: "Nofaol", value: false }], onFilter: (v, r) => r.isActive === v, render: (v: boolean) => v ? <Tag color="gold" icon={<StarOutlined />}>VIP Faol</Tag> : <Tag color="default">Nofaol</Tag> },
    { title: "Daromad", dataIndex: "totalEarnings", key: "totalEarnings", width: 150, sorter: (a, b) => a.totalEarnings - b.totalEarnings, render: (v: number) => <Text strong style={{ color: v > 0 ? "#52c41a" : undefined }}>{fmt(v)} <Text type="secondary" style={{ fontSize: 12, fontWeight: "normal" }}>UZS</Text></Text> },
    { title: "Referallar", dataIndex: "totalReferrals", key: "totalReferrals", width: 110, sorter: (a, b) => a.totalReferrals - b.totalReferrals, render: (v: number) => <Space><TeamOutlined style={{ color: "#1890ff" }} /><Text strong>{v}</Text></Space> },
    { title: "Sana", dataIndex: "createdAt", key: "createdAt", width: 160, sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(), defaultSortOrder: "descend", render: (d: string) => <Tooltip title={dayjs(d).format("DD.MM.YYYY HH:mm:ss")}><Text type="secondary" style={{ fontSize: 13 }}>{dayjs(d).format("DD.MM.YYYY HH:mm")}</Text></Tooltip> },
  ];

  return (
    <Spin spinning={statsLoading}>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}><CrownOutlined style={{ marginRight: 8, color: "#faad14" }} />VIP foydalanuvchilar</Title>
        <Text type="secondary">VIP dasturi statistikasi va boshqaruvi</Text>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12, background: "linear-gradient(135deg, #f7971e 0%, #ffd200 100%)" }}><Statistic title={<span style={{ color: "rgba(255,255,255,0.85)" }}>Jami VIP</span>} value={stats.total} prefix={<CrownOutlined style={{ color: "#fff" }} />} valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 28 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Faol VIP" value={stats.active} prefix={<StarOutlined style={{ color: "#faad14" }} />} valueStyle={{ color: "#52c41a", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Qolgan joylar" value={stats.remaining} prefix={<UserOutlined />} valueStyle={{ color: "#1890ff", fontWeight: 600 }} /></Card></Col>
        <Col xs={24} sm={12} md={6}><Card bordered={false} style={{ borderRadius: 12 }}><Statistic title="Jami daromad" value={stats.totalEarnings || 0} prefix={<DollarOutlined />} suffix="UZS" valueStyle={{ color: "#52c41a", fontWeight: 600 }} formatter={(v) => fmt(v as number)} /></Card></Col>
      </Row>
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <Space style={{ marginBottom: 16, width: "100%", justifyContent: "space-between" }} wrap>
          <Input placeholder="Qidirish: VIP kod, ism, telegram ID..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }} style={{ width: 340 }} allowClear />
          <Button icon={<ReloadOutlined />} onClick={() => refetch()}>Yangilash</Button>
        </Space>
        <Table<VipUser> columns={columns} dataSource={response.data} rowKey="id" loading={listLoading} pagination={{ current: currentPage, pageSize, total: response.total, onChange: (p, s) => { setCurrentPage(p); setPageSize(s); }, showSizeChanger: true, pageSizeOptions: ["10", "15", "25", "50"], showTotal: (t) => "Jami: " + t + " ta VIP" }} size="middle" scroll={{ x: 900 }} />
      </Card>
    </Spin>
  );
};

export default Vip;
