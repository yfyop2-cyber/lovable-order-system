import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Building2, 
  CheckCircle, 
  AlertCircle,
  LogIn,
  Shield,
  Clock,
  Users,
  FileText,
  DollarSign,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  History,
  BarChart3,
  Target,
  Zap,
  Bell,
  Edit
} from 'lucide-react';

const ExpenseManagementApp = () => {
  // 登入狀態管理
  const [loginData, setLoginData] = useState({ employeeId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginStatus, setLoginStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);
  
  // 系統狀態管理
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedApp, setSelectedApp] = useState(null);
  
  // 申請表單狀態
  const [expenseItems, setExpenseItems] = useState([
    { id: 1, category: '', amount: '', description: '', receipt: false }
  ]);
  const [formData, setFormData] = useState({
    applicant: '',
    department: '',
    date: '',
    purpose: '',
    total: 0
  });
  
  // 申請記錄數據
  const [applications, setApplications] = useState([
    { 
      id: 'EXP-2024-001', 
      date: '2024-01-15', 
      amount: 2500, 
      status: 'approved', 
      category: '6105501',
      description: '客戶招待餐費',
      applicant: '陳雅婷',
      department: '行銷部',
      approvalFlow: [
        { level: 1, approver: '直屬主管', name: '李經理', status: 'approved', date: '2024-01-16', comment: '核准' },
        { level: 2, approver: '財務主管', name: '王財務', status: 'approved', date: '2024-01-17', comment: '金額合理，核准' }
      ]
    },
    { 
      id: 'EXP-2024-002', 
      date: '2024-01-20', 
      amount: 850, 
      status: 'pending', 
      category: '5503201',
      description: '工廠視察交通費',
      applicant: '張工程師',
      department: '生產部',
      approvalFlow: [
        { level: 1, approver: '直屬主管', name: '劉主管', status: 'pending', date: null, comment: null }
      ]
    },
    { 
      id: 'EXP-2024-003', 
      date: '2024-01-22', 
      amount: 250000, 
      status: 'reviewing', 
      category: '6103601',
      description: '年度品牌廣告投放',
      applicant: '陳雅婷',
      department: '行銷部',
      approvalFlow: [
        { level: 1, approver: '直屬主管', name: '李經理', status: 'approved', date: '2024-01-23', comment: '重要專案，建議核准' },
        { level: 2, approver: '部門主管', name: '王部長', status: 'approved', date: '2024-01-24', comment: '符合年度預算規劃' },
        { level: 3, approver: '財務主管', name: '王財務', status: 'pending', date: null, comment: null }
      ]
    }
  ]);

  // 員工資料庫
  const employeeDatabase = [
    { 
      id: 'EMP001', password: 'password123', name: '王小明', department: '財務部', 
      position: '會計師', role: 'admin', lastLogin: '2024-01-15 09:30'
    },
    { 
      id: 'EMP002', password: 'mypass456', name: '李美華', department: '人資部', 
      position: '人資專員', role: 'hr', lastLogin: '2024-01-14 14:20'
    },
    { 
      id: 'EMP003', password: 'secure789', name: '張志成', department: '銷售部', 
      position: '業務經理', role: 'manager', lastLogin: '2024-01-13 11:45'
    },
    { 
      id: 'EMP004', password: 'demo2024', name: '陳雅婷', department: '行銷部', 
      position: '行銷專員', role: 'employee', lastLogin: '2024-01-12 16:10'
    },
    { 
      id: 'EMP005', password: 'test1234', name: '劉建國', department: '總經理室', 
      position: '總經理', role: 'ceo', lastLogin: '2024-01-15 08:00'
    }
  ];

  // 完整科目代碼 (從最新Excel檔案更新)
  const expenseCategories = [
    // 直接人工類 (5項)
    { value: '5401101', label: '5401101 - 直接人工', limit: 200000, approver: '人資主管', category: 'direct' },
    { value: '5401102', label: '5401102 - 直接人工-免稅加班', limit: 100000, approver: '人資主管', category: 'direct' },
    { value: '5401103', label: '5401103 - 直接人工-未休假代金', limit: 150000, approver: '人資主管', category: 'direct' },
    { value: '5401104', label: '5401104 - 直接人工-伙食', limit: 50000, approver: '人資主管', category: 'direct' },
    { value: '5499101', label: '5499101 - 已分攤直接人工', limit: 200000, approver: '財務主管', category: 'direct' },

    // 製造費用類 (42項)
    { value: '5501101', label: '5501101 - 製造費用-間接人工', limit: 150000, approver: '部門主管', category: 'mfg' },
    { value: '5501102', label: '5501102 - 製造費用-間接人工(農場代耕)', limit: 80000, approver: '部門主管', category: 'mfg' },
    { value: '5502101', label: '5502101 - 製造費用-租金費用(房屋)', limit: 200000, approver: '財務主管', category: 'mfg' },
    { value: '5502102', label: '5502102 - 製造費用-租金費用(設備)', limit: 150000, approver: '財務主管', category: 'mfg' },
    { value: '5503101', label: '5503101 - 製造費用-文具印刷費', limit: 30000, approver: '直屬主管', category: 'mfg' },
    { value: '5504101', label: '5504101 - 製造費用-旅費交通費', limit: 50000, approver: '直屬主管', category: 'mfg' },
    { value: '5505101', label: '5505101 - 製造費用-運費', limit: 80000, approver: '部門主管', category: 'mfg' },
    { value: '5506101', label: '5506101 - 製造費用-郵電費', limit: 25000, approver: '直屬主管', category: 'mfg' },
    { value: '5507101', label: '5507101 - 製造費用-修繕費', limit: 100000, approver: '部門主管', category: 'mfg' },
    { value: '5508101', label: '5508101 - 製造費用-包裝材料費', limit: 60000, approver: '直屬主管', category: 'mfg' },
    { value: '5509101', label: '5509101 - 製造費用-水費', limit: 40000, approver: '直屬主管', category: 'mfg' },
    { value: '5509102', label: '5509102 - 製造費用-電費', limit: 60000, approver: '直屬主管', category: 'mfg' },
    { value: '5509103', label: '5509103 - 製造費用-瓦斯費', limit: 30000, approver: '直屬主管', category: 'mfg' },
    { value: '5510101', label: '5510101 - 製造費用-保險費', limit: 80000, approver: '財務主管', category: 'mfg' },
    { value: '5511101', label: '5511101 - 製造費用-包裝費', limit: 50000, approver: '直屬主管', category: 'mfg' },
    { value: '5512101', label: '5512101 - 製造費用-加工費', limit: 120000, approver: '部門主管', category: 'mfg' },
    { value: '5513101', label: '5513101 - 製造費用-稅捐', limit: 60000, approver: '財務主管', category: 'mfg' },
    { value: '5515101', label: '5515101 - 製造費用-折舊', limit: 200000, approver: '財務主管', category: 'mfg' },
    { value: '5516101', label: '5516101 - 製造費用-各項攤銷', limit: 150000, approver: '財務主管', category: 'mfg' },
    { value: '5517101', label: '5517101 - 製造費用-勞健保費', limit: 100000, approver: '人資主管', category: 'mfg' },
    { value: '5518101', label: '5518101 - 製造費用-伙食費', limit: 40000, approver: '直屬主管', category: 'mfg' },
    { value: '5519101', label: '5519101 - 製造費用-福利費', limit: 60000, approver: '人資主管', category: 'mfg' },
    { value: '5520101', label: '5520101 - 製造費用-勞務報酬', limit: 80000, approver: '部門主管', category: 'mfg' },
    { value: '5521101', label: '5521101 - 製造費用-燃料費', limit: 70000, approver: '直屬主管', category: 'mfg' },
    { value: '5522101', label: '5522101 - 製造費用-交際費', limit: 50000, approver: '財務主管', category: 'mfg' },
    { value: '5523101', label: '5523101 - 製造費用-退休金', limit: 120000, approver: '人資主管', category: 'mfg' },
    { value: '5524101', label: '5524101 - 製造費用-資訊服務費', limit: 80000, approver: '部門主管', category: 'mfg' },
    { value: '5548101', label: '5548101 - 製造費用-蔬菜損耗', limit: 30000, approver: '直屬主管', category: 'mfg' },
    { value: '5549101', label: '5549101 - 製造費用-雜項購置', limit: 40000, approver: '直屬主管', category: 'mfg' },
    { value: '5550101', label: '5550101 - 製造費用-雜支', limit: 20000, approver: '直屬主管', category: 'mfg' },
    { value: '5550102', label: '5550102 - 製造費用-洗滌費', limit: 25000, approver: '直屬主管', category: 'mfg' },
    { value: '5550103', label: '5550103 - 製造費用-蟲害防治', limit: 30000, approver: '直屬主管', category: 'mfg' },
    { value: '5550104', label: '5550104 - 製造費用-手續費', limit: 20000, approver: '直屬主管', category: 'mfg' },
    { value: '5550105', label: '5550105 - 製造費用-物料器材消耗', limit: 50000, approver: '直屬主管', category: 'mfg' },
    { value: '5550106', label: '5550106 - 製造費用-檢驗費', limit: 40000, approver: '部門主管', category: 'mfg' },
    { value: '5550107', label: '5550107 - 製造費用-垃圾清運', limit: 25000, approver: '直屬主管', category: 'mfg' },
    { value: '5550109', label: '5550109 - 製造費用-損耗', limit: 35000, approver: '直屬主管', category: 'mfg' },
    { value: '5550110', label: '5550110 - 製造費用-樣品費', limit: 30000, approver: '直屬主管', category: 'mfg' },
    { value: '5550111', label: '5550111 - 製造費用-報廢', limit: 40000, approver: '部門主管', category: 'mfg' },
    { value: '5550112', label: '5550112 - 製造費用-書報雜誌費', limit: 15000, approver: '直屬主管', category: 'mfg' },
    { value: '5551101', label: '5551101 - 製造費用-間接材料', limit: 80000, approver: '直屬主管', category: 'mfg' },
    { value: '5599101', label: '5599101 - 已分攤製造費用', limit: 300000, approver: '財務主管', category: 'mfg' },

    // 保留一些常用的推銷、管理、研發費用科目供測試
    { value: '6103601', label: '6103601 - 推-廣告費', limit: 200000, approver: '總經理', category: 'sales' },
    { value: '6105501', label: '6105501 - 推-交際費', limit: 80000, approver: '財務主管', category: 'sales' },
    { value: '6108301', label: '6108301 - 推-佣金支出', limit: 200000, approver: '部門主管', category: 'sales' },
    { value: '6201101', label: '6201101 - 管-薪資支出', limit: 400000, approver: '人資主管', category: 'admin' },
    { value: '6208202', label: '6208202 - 管-研究發展費用', limit: 300000, approver: '總經理', category: 'admin' },
    { value: '6301101', label: '6301101 - 研-薪資支出', limit: 350000, approver: '人資主管', category: 'rd' },
    { value: '6308202', label: '6308202 - 研-研究發展費用', limit: 500000, approver: '總經理', category: 'rd' }
  ];

  // 登入相關函數
  const handleLogin = () => {
    setIsLoading(true);
    setLoginStatus(null);
    setErrorMessage('');

    if (!loginData.employeeId.trim() || !loginData.password.trim()) {
      setLoginStatus('error');
      setErrorMessage('請輸入員工編號和密碼');
      setIsLoading(false);
      return;
    }

    setTimeout(() => {
      const user = employeeDatabase.find(
        emp => emp.id.toLowerCase() === loginData.employeeId.toLowerCase() && 
               emp.password === loginData.password
      );

      if (user) {
        setLoginStatus('success');
        setUserInfo(user);
        setFormData({
          ...formData,
          applicant: user.name,
          department: user.department,
          date: new Date().toISOString().split('T')[0]
        });
        setTimeout(() => {
          setIsLoggedIn(true);
        }, 1000);
      } else {
        setLoginStatus('error');
        setErrorMessage('員工編號或密碼錯誤');
      }
      setIsLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserInfo(null);
    setLoginData({ employeeId: '', password: '' });
    setLoginStatus(null);
    setCurrentView('dashboard');
    setExpenseItems([{ id: 1, category: '', amount: '', description: '', receipt: false }]);
    setFormData({ applicant: '', department: '', date: '', purpose: '', total: 0 });
    setSelectedApp(null);
  };

  // 申請相關函數
  const addExpenseItem = () => {
    setExpenseItems([
      ...expenseItems,
      { id: Date.now(), category: '', amount: '', description: '', receipt: false }
    ]);
  };

  const removeExpenseItem = (id) => {
    if (expenseItems.length > 1) {
      setExpenseItems(expenseItems.filter(item => item.id !== id));
    }
  };

  const updateExpenseItem = (id, field, value) => {
    setExpenseItems(expenseItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return expenseItems.reduce((total, item) => total + (parseFloat(item.amount) || 0), 0);
  };

  const getApprovalFlow = (category, amount) => {
    const cat = expenseCategories.find(c => c.value === category);
    if (!cat) return [{ level: 1, approver: '直屬主管', status: 'pending' }];
    
    let flow = [{ level: 1, approver: '直屬主管', status: 'pending' }];
    
    if (amount > 50000 || cat.category === 'admin' || cat.category === 'rd') {
      flow.push({ level: 2, approver: '部門主管', status: 'pending' });
    }
    
    if (amount > 100000 || cat.approver === '財務主管') {
      flow.push({ level: flow.length + 1, approver: '財務主管', status: 'pending' });
    }
    
    if (amount > 200000 || cat.approver === '總經理') {
      flow.push({ level: flow.length + 1, approver: '總經理', status: 'pending' });
    }
    
    return flow;
  };

  const submitApplication = () => {
    const total = calculateTotal();
    const mainCategory = expenseItems[0]?.category;
    const approvalFlow = getApprovalFlow(mainCategory, total);
    
    const newApplication = {
      id: `EXP-2024-${String(applications.length + 4).padStart(3, '0')}`,
      date: formData.date,
      amount: total,
      status: 'pending',
      category: mainCategory || '其他',
      description: formData.purpose,
      applicant: userInfo.name,
      department: userInfo.department,
      items: [...expenseItems],
      approvalFlow: approvalFlow.map(step => ({
        ...step,
        name: getApproverName(step.approver),
        date: null,
        comment: null
      }))
    };

    setApplications([newApplication, ...applications]);
    
    setExpenseItems([{ id: 1, category: '', amount: '', description: '', receipt: false }]);
    setFormData({
      ...formData,
      purpose: '',
      total: 0
    });

    alert('申請已提交成功！申請編號：' + newApplication.id);
    setCurrentView('history');
  };

  // 審核相關函數
  const getApproverName = (role) => {
    const names = {
      '直屬主管': '李經理',
      '部門主管': '王部長',
      '財務主管': '王財務',
      '總經理': '劉總經理',
      '人資主管': '陳人資'
    };
    return names[role] || role;
  };

  const getUserApprovalRole = (role) => {
    const roleMap = {
      'manager': '直屬主管',
      'admin': '部門主管',
      'ceo': '總經理',
      'hr': '人資主管'
    };
    return roleMap[role] || null;
  };

  const getPendingApprovals = () => {
    if (!userInfo) return [];
    
    const userRole = getUserApprovalRole(userInfo.role);
    return applications.filter(app => {
      const pendingStep = app.approvalFlow?.find(step => step.status === 'pending');
      return pendingStep && pendingStep.approver === userRole;
    });
  };

  const approveApplication = (appId, decision, comment) => {
    setApplications(prevApps => 
      prevApps.map(app => {
        if (app.id === appId) {
          const updatedFlow = app.approvalFlow.map(step => {
            if (step.status === 'pending' && step.approver === getUserApprovalRole(userInfo.role)) {
              return {
                ...step,
                status: decision,
                date: new Date().toISOString().split('T')[0],
                comment: comment || (decision === 'approved' ? '核准' : '拒絕')
              };
            }
            return step;
          });

          const allApproved = updatedFlow.every(step => step.status === 'approved');
          const hasRejection = updatedFlow.some(step => step.status === 'rejected');
          
          let newStatus = app.status;
          if (hasRejection) {
            newStatus = 'rejected';
          } else if (allApproved) {
            newStatus = 'approved';
          } else {
            newStatus = 'reviewing';
          }

          return {
            ...app,
            approvalFlow: updatedFlow,
            status: newStatus
          };
        }
        return app;
      })
    );
  };

  // 狀態相關函數
  const getStatusColor = (status) => {
    switch(status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewing': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'approved': return '已核准';
      case 'rejected': return '已拒絕';
      case 'pending': return '待審核';
      case 'reviewing': return '審核中';
      default: return '未知';
    }
  };

  // 登入畫面
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-5xl w-full">
          <div className="flex flex-col lg:flex-row">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 lg:w-2/5 text-white">
              <div className="flex items-center mb-8">
                <Building2 className="w-8 h-8 mr-3" />
                <h1 className="text-2xl font-bold">費用管理系統</h1>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <Shield className="w-6 h-6 mr-3 mt-1 text-blue-200" />
                  <div>
                    <h3 className="font-semibold mb-2">完整功能系統</h3>
                    <p className="text-blue-100 text-sm">包含申請、審核、記錄查詢等完整功能</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <CheckCircle className="w-6 h-6 mr-3 mt-1 text-blue-200" />
                  <div>
                    <h3 className="font-semibold mb-2">智慧審核流程</h3>
                    <p className="text-blue-100 text-sm">根據金額和科目自動分配審核路徑</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Zap className="w-6 h-6 mr-3 mt-1 text-blue-200" />
                  <div>
                    <h3 className="font-semibold mb-2">即時測試體驗</h3>
                    <p className="text-blue-100 text-sm">支援完整的申請提交和審核流程測試</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-white/10 rounded-lg">
                <h4 className="font-medium mb-2">快速測試</h4>
                <div className="text-sm text-blue-100 space-y-1">
                  <div 
                    className="cursor-pointer hover:text-white transition-colors p-1 rounded"
                    onClick={() => setLoginData({employeeId: 'EMP004', password: 'demo2024'})}
                  >
                    👤 EMP004 / demo2024 (一般員工)
                  </div>
                  <div 
                    className="cursor-pointer hover:text-white transition-colors p-1 rounded"
                    onClick={() => setLoginData({employeeId: 'EMP003', password: 'secure789'})}
                  >
                    👨‍💼 EMP003 / secure789 (業務經理)
                  </div>
                  <div 
                    className="cursor-pointer hover:text-white transition-colors p-1 rounded"
                    onClick={() => setLoginData({employeeId: 'EMP005', password: 'test1234'})}
                  >
                    👑 EMP005 / test1234 (總經理)
                  </div>
                </div>
              </div>
            </div>

            <div className="p-8 lg:w-3/5">
              <div className="max-w-md mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">員工登入</h2>
                  <p className="text-gray-600">請輸入您的員工編號和密碼</p>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">員工編號</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={loginData.employeeId}
                        onChange={(e) => setLoginData({...loginData, employeeId: e.target.value.toUpperCase()})}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="請輸入員工編號"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">密碼</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="請輸入密碼"
                        disabled={isLoading}
                        onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  {loginStatus === 'error' && (
                    <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
                      <span className="text-red-700 text-sm">{errorMessage}</span>
                    </div>
                  )}

                  {loginStatus === 'success' && (
                    <div className="flex items-center p-3 bg-green-50 border border-green-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      <span className="text-green-700 text-sm">登入成功，正在進入系統...</span>
                    </div>
                  )}

                  <button
                    onClick={handleLogin}
                    disabled={isLoading || !loginData.employeeId || !loginData.password}
                    className={`w-full flex items-center justify-center py-3 px-4 rounded-lg text-white font-medium transition-all ${
                      isLoading || !loginData.employeeId || !loginData.password
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        登入中...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <LogIn className="w-5 h-5 mr-2" />
                        登入系統
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 主系統畫面
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Building2 className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">費用管理系統</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-800">{userInfo?.name}</p>
                <p className="text-xs text-gray-600">{userInfo?.department} · {userInfo?.position}</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                登出
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'dashboard', label: '首頁', icon: <BarChart3 className="w-4 h-4" /> },
              { id: 'apply', label: '費用申請', icon: <FileText className="w-4 h-4" /> },
              { id: 'history', label: '申請記錄', icon: <History className="w-4 h-4" /> },
              ...(getUserApprovalRole(userInfo.role) ? [{ id: 'approve', label: '審核管理', icon: <CheckCircle className="w-4 h-4" /> }] : [])
            ].map(nav => (
              <button
                key={nav.id}
                onClick={() => setCurrentView(nav.id)}
                className={`flex items-center px-4 py-4 text-sm font-medium transition-colors ${
                  currentView === nav.id
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {nav.icon}
                <span className="ml-2">{nav.label}</span>
                {nav.id === 'approve' && getPendingApprovals().length > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {getPendingApprovals().length}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Dashboard View */}
        {currentView === 'dashboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">系統概覽</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-blue-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">本月申請</p>
                    <p className="text-2xl font-bold">{applications.length} 筆</p>
                  </div>
                  <FileText className="w-8 h-8 text-blue-200" />
                </div>
              </div>
              <div className="bg-green-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">已核准</p>
                    <p className="text-2xl font-bold">{applications.filter(app => app.status === 'approved').length} 筆</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-200" />
                </div>
              </div>
              <div className="bg-yellow-600 text-white rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-100 text-sm">待審核</p>
                    <p className="text-2xl font-bold">{applications.filter(app => app.status === 'pending' || app.status === 'reviewing').length} 筆</p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-200" />
                </div>
              </div>
              {getUserApprovalRole(userInfo.role) && (
                <div className="bg-purple-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">我的待審</p>
                      <p className="text-2xl font-bold">{getPendingApprovals().length} 筆</p>
                    </div>
                    <Users className="w-8 h-8 text-purple-200" />
                  </div>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">快速操作</h3>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('apply')}
                    className="w-full flex items-center p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Plus className="w-6 h-6 text-blue-600 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800">提交新申請</h4>
                      <p className="text-sm text-gray-600">建立新的費用申請</p>
                    </div>
                  </button>
                  <button
                    onClick={() => setCurrentView('history')}
                    className="w-full flex items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <History className="w-6 h-6 text-gray-600 mr-3" />
                    <div className="text-left">
                      <h4 className="font-medium text-gray-800">查看申請記錄</h4>
                      <p className="text-sm text-gray-600">檢視過往申請狀況</p>
                    </div>
                  </button>
                  {getUserApprovalRole(userInfo.role) && (
                    <button
                      onClick={() => setCurrentView('approve')}
                      className="w-full flex items-center p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
                      <div className="text-left flex-1">
                        <h4 className="font-medium text-gray-800">審核管理</h4>
                        <p className="text-sm text-gray-600">處理待審核申請</p>
                      </div>
                      {getPendingApprovals().length > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                          {getPendingApprovals().length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">最近申請</h3>
                <div className="space-y-3">
                  {applications.slice(0, 3).map((app) => (
                    <div key={app.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-800">{app.id}</div>
                        <div className="text-sm text-gray-600">{app.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-800">NT$ {app.amount.toLocaleString()}</div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                          {getStatusLabel(app.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Apply View */}
        {currentView === 'apply' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">費用申請</h2>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首頁
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">申請人</label>
                  <input
                    type="text"
                    value={formData.applicant}
                    readOnly
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">部門</label>
                  <input
                    type="text"
                    value={formData.department}
                    readOnly
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">申請日期</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">總金額</label>
                  <input
                    type="text"
                    value={`NT$ ${calculateTotal().toLocaleString()}`}
                    readOnly
                    className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md font-medium text-green-600"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">申請目的</label>
                <textarea
                  value={formData.purpose}
                  onChange={(e) => setFormData({...formData, purpose: e.target.value})}
                  rows={3}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="請詳細說明費用申請的目的與用途"
                />
              </div>

              {/* Expense Items */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-800">費用明細</h3>
                  <button
                    onClick={addExpenseItem}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    新增項目
                  </button>
                </div>

                <div className="space-y-4">
                  {expenseItems.map((item, index) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">費用類別</label>
                        <select
                          value={item.category}
                          onChange={(e) => updateExpenseItem(item.id, 'category', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">請選擇科目</option>
                          
                          <optgroup label="直接人工 (5項)">
                            {expenseCategories.filter(cat => cat.category === 'direct').map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </optgroup>
                          
                          <optgroup label="製造費用 (42項)">
                            {expenseCategories.filter(cat => cat.category === 'mfg').map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </optgroup>
                          
                          <optgroup label="推銷費用">
                            {expenseCategories.filter(cat => cat.category === 'sales').map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </optgroup>
                          
                          <optgroup label="管理費用">
                            {expenseCategories.filter(cat => cat.category === 'admin').map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </optgroup>
                          
                          <optgroup label="研發費用">
                            {expenseCategories.filter(cat => cat.category === 'rd').map(cat => (
                              <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                          </optgroup>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">金額 (NT$)</label>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateExpenseItem(item.id, 'amount', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="0"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">說明</label>
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => updateExpenseItem(item.id, 'description', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                          placeholder="請輸入費用說明"
                        />
                        
                        {item.category && item.amount && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-md">
                            <div className="text-xs text-blue-700 mb-1">
                              <strong>科目資訊:</strong>
                            </div>
                            <div className="text-xs text-blue-600">
                              限額: NT$ {expenseCategories.find(c => c.value === item.category)?.limit?.toLocaleString() || 'N/A'}
                            </div>
                            <div className="text-xs text-blue-600">
                              核准者: {expenseCategories.find(c => c.value === item.category)?.approver || 'N/A'}
                            </div>
                            {parseFloat(item.amount) > (expenseCategories.find(c => c.value === item.category)?.limit || 0) && (
                              <div className="text-xs text-red-600 flex items-center mt-1">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                超過科目限額，需要更高層級核准
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={item.receipt}
                              onChange={(e) => updateExpenseItem(item.id, 'receipt', e.target.checked)}
                              className="mr-2 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">已上傳單據</span>
                          </label>
                        </div>
                        {expenseItems.length > 1 && (
                          <button
                            onClick={() => removeExpenseItem(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={submitApplication}
                  disabled={!formData.purpose || expenseItems.every(item => !item.category || !item.amount)}
                  className={`flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                    !formData.purpose || expenseItems.every(item => !item.category || !item.amount)
                      ? 'bg-gray-400 text-white cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  <Send className="w-4 h-4 mr-2" />
                  提交申請
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Approve View */}
        {currentView === 'approve' && (
          <ApprovalManagement 
            applications={applications}
            userInfo={userInfo}
            getUserApprovalRole={getUserApprovalRole}
            getPendingApprovals={getPendingApprovals}
            approveApplication={approveApplication}
          />
        )}

        {/* History View */}
        {currentView === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">申請記錄</h2>
              <button
                onClick={() => setCurrentView('apply')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-2" />
                新增申請
              </button>
            </div>

            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請編號</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">申請日期</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">費用類別</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">狀態</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">說明</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {applications.map((app) => (
                      <React.Fragment key={app.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{app.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{app.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{expenseCategories.find(c => c.value === app.category)?.label || app.category}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">NT$ {app.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(app.status)}`}>
                              {getStatusLabel(app.status)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{app.description}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <button
                              onClick={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              {selectedApp === app.id ? '隱藏' : '詳情'}
                            </button>
                          </td>
                        </tr>
                        {selectedApp === app.id && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <ApprovalFlowDisplay approvalFlow={app.approvalFlow} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

              {applications.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">尚無申請記錄</p>
                  <button
                    onClick={() => setCurrentView('apply')}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    建立第一筆申請
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 審核流程顯示組件
const ApprovalFlowDisplay = ({ approvalFlow }) => {
  if (!approvalFlow || approvalFlow.length === 0) {
    return <div className="text-gray-500 text-sm">無審核流程資訊</div>;
  }

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-800 mb-3">審核流程</h4>
      <div className="flex items-center space-x-4 overflow-x-auto">
        {approvalFlow.map((step, index) => (
          <div key={index} className="flex items-center">
            <div className="flex flex-col items-center min-w-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                step.status === 'approved' ? 'bg-green-500 text-white' :
                step.status === 'rejected' ? 'bg-red-500 text-white' :
                step.status === 'pending' ? 'bg-yellow-500 text-white' :
                'bg-gray-300 text-gray-600'
              }`}>
                {step.status === 'approved' ? '✓' :
                 step.status === 'rejected' ? '✗' :
                 step.level}
              </div>
              <div className="mt-2 text-center">
                <div className="text-xs font-medium text-gray-800">{step.approver}</div>
                <div className="text-xs text-gray-600">{step.name}</div>
                {step.date && (
                  <div className="text-xs text-gray-500">{step.date}</div>
                )}
                {step.comment && (
                  <div className="text-xs text-gray-600 mt-1 max-w-20 truncate" title={step.comment}>
                    {step.comment}
                  </div>
                )}
              </div>
            </div>
            {index < approvalFlow.length - 1 && (
              <div className={`w-8 h-0.5 ${
                step.status === 'approved' ? 'bg-green-300' : 'bg-gray-300'
              }`}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// 審核管理組件
const ApprovalManagement = ({ applications, userInfo, getUserApprovalRole, getPendingApprovals, approveApplication }) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">審核管理</h2>
        <div className="text-sm text-gray-600">
          待審核申請：{getPendingApprovals().length} 筆
        </div>
      </div>

      {getPendingApprovals().length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <CheckCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">暫無待審核申請</h3>
          <p className="text-gray-600">所有申請都已處理完成</p>
        </div>
      ) : (
        <div className="space-y-6">
          {getPendingApprovals().map((app) => (
            <ApprovalCard 
              key={app.id} 
              application={app} 
              onApprove={approveApplication}
              userRole={getUserApprovalRole(userInfo.role)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// 審核卡片組件
const ApprovalCard = ({ application, onApprove, userRole }) => {
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  const handleApproval = (decision) => {
    onApprove(application.id, decision, comment || (decision === 'approved' ? '核准' : '拒絕'));
    setComment('');
    setShowCommentInput(false);
  };

  const currentStep = application.approvalFlow?.find(step => 
    step.status === 'pending' && step.approver === userRole
  );

  if (!currentStep) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{application.id}</h3>
          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
            <span>申請人: {application.applicant}</span>
            <span>部門: {application.department}</span>
            <span>日期: {application.date}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">NT$ {application.amount.toLocaleString()}</div>
          <div className="text-sm text-gray-600">待您審核</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-sm text-gray-600 mb-2">
          <strong>申請項目:</strong> {application.category}
        </div>
        <div className="text-sm text-gray-600">
          <strong>申請目的:</strong> {application.description}
        </div>
      </div>

      <div className="mb-6">
        <ApprovalFlowDisplay approvalFlow={application.approvalFlow} />
      </div>

      <div className="border-t border-gray-200 pt-4">
        <div className="mb-4">
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showCommentInput ? '隱藏備註' : '添加審核備註'}
          </button>
        </div>

        {showCommentInput && (
          <div className="mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="請輸入審核意見..."
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        <div className="flex space-x-3">
          <button
            onClick={() => handleApproval('approved')}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
          >
            ✓ 核准
          </button>
          <button
            onClick={() => handleApproval('rejected')}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            ✗ 拒絕
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpenseManagementApp;