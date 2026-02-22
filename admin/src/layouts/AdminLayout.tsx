import React, { useState } from 'react';
import { Layout, Menu, Switch, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  NotificationOutlined,
  UserOutlined,
  CreditCardOutlined,
  DollarOutlined,
  StopOutlined,
  TeamOutlined,
  ApiOutlined,
  CrownOutlined,
  SettingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const { Header, Sider, Content } = Layout;

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/posts', icon: <NotificationOutlined />, label: "E'lonlar" },
  { key: '/users', icon: <UserOutlined />, label: 'Foydalanuvchilar' },
  { key: '/subscriptions', icon: <CreditCardOutlined />, label: 'Obunalar' },
  { key: '/payments', icon: <DollarOutlined />, label: "To'lovlar" },
  { key: '/blocked', icon: <StopOutlined />, label: 'Bloklangan' },
  { key: '/groups', icon: <TeamOutlined />, label: 'Guruhlar' },
  { key: '/sessions', icon: <ApiOutlined />, label: 'Sessiyalar' },
  { key: '/vip', icon: <CrownOutlined />, label: 'VIP' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Sozlamalar' },
];

interface Props {
  isDark: boolean;
  onToggleTheme: () => void;
}

const AdminLayout: React.FC<Props> = ({ isDark, onToggleTheme }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme="dark"
        width={240}
      >
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <Typography.Title level={4} style={{ color: '#FC3F1D', margin: 0 }}>
            {collapsed ? 'D' : 'Dispatchr'}
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ cursor: 'pointer' }} onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <BulbOutlined />
            <Switch checked={isDark} onChange={onToggleTheme} size="small" />
          </div>
        </Header>
        <Content style={{ margin: 24, padding: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
