import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Filter, Home, Edit, Package, Trash2, Eye, X, Upload, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

import { OrderEditDialog } from "./OrderEditDialog";
import { PickupDialog } from "./PickupDialog";
import { ExportImportDialog } from "./ExportImportDialog";

type Order = Tables<'sale_order_h'>;
type Customer = Tables<'customers'>;
type Store = Tables<'stores'>;

const OrdersPage = () => {
  const [orders, setOrders] = useState<(Order & { customer: Customer | null; store: Store | null })[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storeFilter, setStoreFilter] = useState<string>("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPickupDialog, setShowPickupDialog] = useState(false);
  const [showExportImportDialog, setShowExportImportDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchOrders();
    fetchStores();
  }, []);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('sale_order_h')
        .select(`
          *,
          customers(*),
          stores(*)
        `);

      // Apply store filter based on user permissions
      if (user?.s_no && user.s_no !== 'ALL') {
        query = query.eq('s_no', user.s_no);
      }

      const { data, error } = await query.order('od_date', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "錯誤",
          description: "無法載入訂單資料",
          variant: "destructive",
        });
        return;
      }

      setOrders(data.map(order => ({
        ...order,
        customer: order.customers as Customer | null,
        store: order.stores as Store | null
      })));
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "錯誤",
        description: "無法載入訂單資料",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('status', 1)
        .order('s_name');

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.od_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer?.c_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.store?.s_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || order.od_status === statusFilter;
    const matchesStore = storeFilter === "all" || order.s_no === storeFilter;
    
    return matchesSearch && matchesStatus && matchesStore;
  });

  const getStatusText = (status: string | null) => {
    switch (status) {
      case 'completed':
        return '已完成';
      case 'processing':
        return '處理中';
      case 'cancelled':
        return '已取消';
      default:
        return '待處理';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-600">已完成</Badge>;
      case 'processing':
        return <Badge className="bg-blue-600">處理中</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">已取消</Badge>;
      default:
        return <Badge variant="secondary">待處理</Badge>;
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      // Check if order has pickup records
      const { data: pickupCheck } = await supabase
        .from('sale_order_d')
        .select('od_pick_qty')
        .eq('od_id', orderId);

      const hasPickups = pickupCheck?.some(item => (item.od_pick_qty || 0) > 0);
      
      if (hasPickups) {
        toast({
          title: "錯誤",
          description: "此訂單已有取貨記錄，無法刪除",
          variant: "destructive",
        });
        return;
      }

      // Delete order details first
      const { error: detailsError } = await supabase
        .from('sale_order_d')
        .delete()
        .eq('od_id', orderId);

      if (detailsError) throw detailsError;

      // Delete order header
      const { error: headerError } = await supabase
        .from('sale_order_h')
        .delete()
        .eq('od_id', orderId);

      if (headerError) throw headerError;

      toast({
        title: "成功",
        description: "訂單刪除成功",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "錯誤",
        description: "刪除訂單失敗",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('sale_order_h')
        .update({ od_status: 'cancelled' })
        .eq('od_id', orderId);

      if (error) throw error;

      toast({
        title: "成功",
        description: "訂單已取消",
      });

      fetchOrders();
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: "錯誤",
        description: "取消訂單失敗",
        variant: "destructive",
      });
    }
  };

  const canDeleteOrder = (order: Order) => {
    return order.od_status === 'pending' || order.od_status === null;
  };

  const canEditOrder = (order: Order) => {
    return order.od_status !== 'cancelled';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">訂單管理</h1>
          <p className="text-muted-foreground">管理所有訂單資料</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/')}>
            <Home className="mr-2 h-4 w-4" />
            返回首頁
          </Button>
          <Button 
            variant="outline"
            onClick={() => setShowExportImportDialog(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            匯入/匯出
          </Button>
          <Button 
            className="bg-gradient-primary hover:shadow-glow"
            onClick={() => navigate('/orders/create')}
          >
            <Plus className="mr-2 h-4 w-4" />
            新增訂單
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>訂單篩選</CardTitle>
          <CardDescription>搜尋和篩選訂單</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">搜尋訂單</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="搜尋訂單編號、客戶或門市..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <Label>訂單狀態</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇狀態" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部狀態</SelectItem>
                  <SelectItem value="pending">待處理</SelectItem>
                  <SelectItem value="processing">處理中</SelectItem>
                  <SelectItem value="completed">已完成</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>門市篩選</Label>
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部門市</SelectItem>
                  {stores.map(store => (
                    <SelectItem key={store.s_no} value={store.s_no}>
                      {store.s_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setStoreFilter("all");
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                清除篩選
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>訂單列表</CardTitle>
          <CardDescription>
            共 {filteredOrders.length} 筆訂單
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">載入中...</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>訂單編號</TableHead>
                  <TableHead>客戶名稱</TableHead>
                  <TableHead>門市</TableHead>
                  <TableHead>訂單日期</TableHead>
                  <TableHead>預約取貨日期</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">暫無訂單資料</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => (
                    <TableRow key={order.od_id}>
                      <TableCell className="font-medium">{order.od_id}</TableCell>
                      <TableCell>{order.customer?.c_name || '-'}</TableCell>
                      <TableCell>{order.store?.s_name || '-'}</TableCell>
                      <TableCell>{order.od_date || '-'}</TableCell>
                      <TableCell>{order.od_pkdate || '-'}</TableCell>
                      <TableCell>
                        {getStatusBadge(order.od_status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {canEditOrder(order) && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedOrderId(order.od_id);
                                setShowEditDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              setSelectedOrderId(order.od_id);
                              setShowPickupDialog(true);
                            }}
                          >
                            <Package className="h-4 w-4" />
                          </Button>

                          {canDeleteOrder(order) ? (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認刪除</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要刪除訂單 {order.od_id} 嗎？此操作無法復原。
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>取消</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteOrder(order.od_id)}>
                                    刪除
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <X className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>確認取消</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    確定要取消訂單 {order.od_id} 嗎？
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>返回</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleCancelOrder(order.od_id)}>
                                    取消訂單
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}

      <OrderEditDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        orderId={selectedOrderId}
        onSuccess={fetchOrders}
      />

      <PickupDialog
        open={showPickupDialog}
        onOpenChange={setShowPickupDialog}
        orderId={selectedOrderId}
        onSuccess={fetchOrders}
      />

      <ExportImportDialog
        open={showExportImportDialog}
        onOpenChange={setShowExportImportDialog}
      />
    </div>
  );
};

export default OrdersPage;