import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, Save, ArrowLeft, Search, User, Phone, Store, Calendar, Package, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type Customer = Tables<'customers'>;
type Store = Tables<'stores'>;
type Part = Tables<'part'>;

interface OrderItem {
  id: string;
  p_name: string;
  p_kind: string;
  od_qty: number;
  od_remark: string;
  suggestions: Part[];
  showSuggestions: boolean;
  existsInPart: boolean;
}

interface CustomerSuggestion extends Customer {
  isExisting: boolean;
}

const CreateOrderPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Basic data
  const [stores, setStores] = useState<Store[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  
  // Order form data
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [selectedStore, setSelectedStore] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [remark, setRemark] = useState("");
  
  // Customer search
  const [customerSuggestions, setCustomerSuggestions] = useState<CustomerSuggestion[]>([]);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  
  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      id: Date.now().toString(),
      p_name: "",
      p_kind: "",
      od_qty: 1,
      od_remark: "",
      suggestions: [],
      showSuggestions: false,
      existsInPart: false
    }
  ]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setIsLoading(true);
    try {
      const [storesData, customersData, partsData] = await Promise.all([
        supabase.from('stores').select('*').eq('status', 1).order('s_name'),
        supabase.from('customers').select('*').order('c_name'),
        supabase.from('part').select('*').eq('p_status', 1).order('p_name')
      ]);

      setStores(storesData.data || []);
      setCustomers(customersData.data || []);
      setParts(partsData.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "錯誤",
        description: "無法載入基礎資料",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Customer search and selection
  const searchCustomers = (query: string, type: 'phone' | 'name') => {
    if (!query.trim()) {
      setCustomerSuggestions([]);
      setShowCustomerSuggestions(false);
      setIsNewCustomer(false);
      return;
    }

    const filtered = customers.filter(c => 
      type === 'phone' 
        ? c.c_phone.includes(query)
        : c.c_name.toLowerCase().includes(query.toLowerCase())
    );

    const suggestions: CustomerSuggestion[] = filtered.map(c => ({ ...c, isExisting: true }));

    // Add "new customer" option if no exact match
    const hasExactMatch = filtered.some(c => 
      type === 'phone' ? c.c_phone === query : c.c_name === query
    );

    if (!hasExactMatch && query.trim()) {
      const newCustomer: CustomerSuggestion = {
        c_id: -1,
        c_name: type === 'name' ? query : customerName || '新客戶',
        c_phone: type === 'phone' ? query : customerPhone || '',
        c_no: null,
        c_remark: null,
        cc_no: null,
        isExisting: false
      };
      suggestions.unshift(newCustomer);
    }

    setCustomerSuggestions(suggestions);
    setShowCustomerSuggestions(suggestions.length > 0);
    setIsNewCustomer(!hasExactMatch);
  };

  const selectCustomer = (customer: CustomerSuggestion) => {
    setCustomerName(customer.c_name);
    setCustomerPhone(customer.c_phone);
    setIsNewCustomer(!customer.isExisting);
    setShowCustomerSuggestions(false);
  };

  // Product search and management  
  const searchProducts = (query: string, itemId: string) => {
    const itemIndex = orderItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    setOrderItems(prevItems => {
      const updated = [...prevItems];
      
      if (!query.trim()) {
        updated[itemIndex] = {
          ...updated[itemIndex],
          suggestions: [],
          showSuggestions: false,
          existsInPart: false,
          p_kind: ""
        };
        return updated;
      }

      // 立即搜索現有商品
      const filtered = parts.filter(p => 
        p.p_name.toLowerCase().includes(query.toLowerCase())
      );

      const exactMatch = parts.find(p => p.p_name.toLowerCase() === query.toLowerCase());
      const existsInPart = !!exactMatch;

      updated[itemIndex] = {
        ...updated[itemIndex],
        suggestions: filtered.slice(0, 10), // 限制建議數量提升性能
        showSuggestions: filtered.length > 0 && query.length >= 1,
        existsInPart,
        p_kind: exactMatch?.p_kind || (existsInPart ? "" : "新商品")
      };

      // 清除其他行的建議但保持當前行的狀態
      updated.forEach((item, i) => {
        if (i !== itemIndex && item.showSuggestions) {
          item.showSuggestions = false;
        }
      });

      return updated;
    });
  };

  const selectProduct = (part: Part, itemId: string) => {
    const itemIndex = orderItems.findIndex(item => item.id === itemId);
    if (itemIndex === -1) return;

    const updated = [...orderItems];
    updated[itemIndex] = {
      ...updated[itemIndex],
      p_name: part.p_name,
      p_kind: part.p_kind || "",
      suggestions: [],
      showSuggestions: false,
      existsInPart: true
    };

    setOrderItems(updated);
  };

  const updateOrderItem = (itemId: string, field: keyof OrderItem, value: any) => {
    setOrderItems(prevItems => {
      const updated = [...prevItems];
      const itemIndex = updated.findIndex(item => item.id === itemId);
      if (itemIndex === -1) return prevItems;

      updated[itemIndex] = { ...updated[itemIndex], [field]: value };
      return updated;
    });

    // 商品名稱變更時觸發搜索
    if (field === 'p_name') {
      // 使用setTimeout確保狀態更新完成後再搜索
      setTimeout(() => {
        searchProducts(value, itemId);
      }, 0);
    }
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      p_name: "",
      p_kind: "",
      od_qty: 1,
      od_remark: "",
      suggestions: [],
      showSuggestions: false,
      existsInPart: false
    };
    setOrderItems([...orderItems, newItem]);
  };

  const removeOrderItem = (itemId: string) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter(item => item.id !== itemId));
    }
  };

  // Generate NEW part number for non-existing products
  const generateNewPartNo = async () => {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // 使用 Supabase 函數取得今天已有的筆數
    const { data: count, error } = await (supabase as any).rpc('get_today_new_pno_count');
    
    if (error) {
      console.error('Error getting today new pno count:', error);
      throw new Error('無法生成商品編號');
    }
    
    // 下一個流水號 = 今天已有筆數 + 1，補零至兩位數
    const nextNumber = (count + 1).toString().padStart(2, '0');
    
    return `NEW${dateStr}${nextNumber}`;
  };

  const generateOrderId = () => {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD${date}${random}`;
  };

  const handleSaveOrder = async () => {
    // Validation
    if (!customerName.trim() || !customerPhone.trim()) {
      toast({
        title: "錯誤",
        description: "請填寫完整的客戶資訊",
        variant: "destructive",
      });
      return;
    }

    if (!selectedStore) {
      toast({
        title: "錯誤",
        description: "請選擇門市",
        variant: "destructive",
      });
      return;
    }

    const validItems = orderItems.filter(item => item.p_name.trim());
    if (validItems.length === 0) {
      toast({
        title: "錯誤",
        description: "請至少新增一個商品",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      // Find or create customer
      let customerId: number;
      const existingCustomer = customers.find(c => 
        c.c_name === customerName.trim() && c.c_phone === customerPhone.trim()
      );

      if (existingCustomer) {
        customerId = existingCustomer.c_id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            c_name: customerName.trim(),
            c_phone: customerPhone.trim()
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customerId = newCustomer.c_id;
      }

      const orderId = generateOrderId();
      
      // Create order header
      const { error: headerError } = await supabase
        .from('sale_order_h')
        .insert({
          od_id: orderId,
          c_id: customerId,
          s_no: selectedStore,
          od_pkdate: pickupDate || null,
          od_remark: remark || null,
          od_status: 'pending',
          od_user: user?.userid || null
        });

      if (headerError) throw headerError;

      // Process order items - 批量插入提升性能
      const orderDetails = [];
      
      for (const item of validItems) {
        let partNo: string;
        
        // 檢查商品是否存在於PART表中
        const existingPart = parts.find(p => 
          p.p_name.trim().toLowerCase() === item.p_name.trim().toLowerCase()
        );
        
        if (existingPart) {
          partNo = existingPart.p_no;
        } else {
          // 生成新商品編號 (NEW + 日期 + 序號)
          partNo = await generateNewPartNo();
        }

        orderDetails.push({
          od_id: orderId,
          p_no: partNo,
          p_name: item.p_name.trim(),
          p_kind: item.p_kind?.trim() || null,
          od_qty: item.od_qty,
          odd_status: '未取'
        });
      }

      // 批量插入訂單明細
      const { error: detailError } = await supabase
        .from('sale_order_d')
        .insert(orderDetails);

      if (detailError) {
        console.error('Error inserting order details:', detailError);
        throw new Error('新增訂單明細失敗: ' + detailError.message);
      }

      toast({
        title: "成功",
        description: `訂單 ${orderId} 建立成功`,
      });

      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "錯誤",
        description: "建立訂單失敗",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">新增訂單</h1>
          <p className="text-muted-foreground">建立新的客戶訂單</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回訂單列表
          </Button>
          <Button 
            onClick={handleSaveOrder}
            disabled={isSaving}
            className="bg-gradient-primary hover:shadow-glow"
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            儲存訂單
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Customer Information */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                客戶資訊
              </CardTitle>
              <CardDescription>
                輸入客戶資訊，系統會自動搜尋現有客戶
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 relative">
                <Label htmlFor="customerPhone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  客戶電話 *
                </Label>
                <Input
                  id="customerPhone"
                  placeholder="輸入電話號碼"
                  value={customerPhone}
                  onChange={(e) => {
                    setCustomerPhone(e.target.value);
                    searchCustomers(e.target.value, 'phone');
                  }}
                  onFocus={() => searchCustomers(customerPhone, 'phone')}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                />
                
                <Label htmlFor="customerName" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  客戶姓名 *
                </Label>
                <Input
                  id="customerName"
                  placeholder="輸入客戶姓名"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    searchCustomers(e.target.value, 'name');
                  }}
                  onFocus={() => searchCustomers(customerName, 'name')}
                  onBlur={() => setTimeout(() => setShowCustomerSuggestions(false), 200)}
                />

                {showCustomerSuggestions && (
                  <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto">
                    {customerSuggestions.map((customer, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 hover:bg-muted cursor-pointer text-sm border-b last:border-b-0"
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">{customer.c_name}</div>
                            <div className="text-muted-foreground">{customer.c_phone}</div>
                          </div>
                          <Badge variant={customer.isExisting ? "default" : "secondary"}>
                            {customer.isExisting ? "現有客戶" : "新客戶"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {isNewCustomer && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-800 dark:text-blue-200">
                    <Plus className="h-4 w-4" />
                    新客戶
                  </div>
                  <p className="text-sm text-blue-600 dark:text-blue-300">
                    此客戶資訊將會被自動新增到系統中
                  </p>
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="store" className="flex items-center gap-2">
                  <Store className="h-4 w-4" />
                  門市 *
                </Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇門市" />
                  </SelectTrigger>
                  <SelectContent>
                    {stores
                      .filter(store => store.s_no && store.s_no.trim() !== '')
                      .map(store => (
                      <SelectItem key={store.s_no} value={store.s_no}>
                        {store.s_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pickupDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  預約取貨日期
                </Label>
                <Input
                  id="pickupDate"
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="remark" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  訂單備註
                </Label>
                <Textarea
                  id="remark"
                  placeholder="輸入訂單備註..."
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                訂單明細
              </CardTitle>
              <CardDescription>
                新增商品項目，可搜尋現有商品或新增新商品
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">商品名稱</TableHead>
                      <TableHead className="w-[15%]">數量</TableHead>
                      <TableHead className="w-[35%]">備註</TableHead>
                      <TableHead className="w-[10%]">刪除</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orderItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="relative">
                          <div className="space-y-2">
                            <Input
                              placeholder="輸入商品名稱進行搜尋"
                              value={item.p_name}
                              onChange={(e) => {
                                const newValue = e.target.value;
                                updateOrderItem(item.id, 'p_name', newValue);
                              }}
                              onFocus={() => {
                                if (item.p_name.trim()) {
                                  searchProducts(item.p_name, item.id);
                                }
                              }}
                              onBlur={() => {
                                setTimeout(() => {
                                  setOrderItems(prevItems => {
                                    const updated = [...prevItems];
                                    const itemIndex = updated.findIndex(i => i.id === item.id);
                                    if (itemIndex !== -1) {
                                      updated[itemIndex] = { ...updated[itemIndex], showSuggestions: false };
                                    }
                                    return updated;
                                  });
                                }, 200);
                              }}
                            />
                            
                            {item.showSuggestions && item.suggestions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 bg-background border rounded-md shadow-lg z-50 max-h-40 overflow-y-auto mt-1">
                                {item.suggestions.map(part => (
                                  <div
                                    key={part.p_no}
                                    className="px-3 py-2 hover:bg-muted cursor-pointer text-sm"
                                    onClick={() => selectProduct(part, item.id)}
                                  >
                                    <div className="font-medium">{part.p_name}</div>
                                    <div className="text-muted-foreground text-xs">{part.p_kind}</div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {item.p_name && (
                              <div className="flex items-center gap-2">
                                <Badge variant={item.existsInPart ? "default" : "secondary"} className="text-xs">
                                  {item.existsInPart ? "現有商品" : "新商品"}
                                </Badge>
                                {item.p_kind && (
                                  <Badge variant="outline" className="text-xs">
                                    {item.p_kind}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="1"
                            value={item.od_qty}
                            onChange={(e) => updateOrderItem(item.id, 'od_qty', parseInt(e.target.value) || 1)}
                            className="w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="輸入商品備註..."
                            value={item.od_remark}
                            onChange={(e) => updateOrderItem(item.id, 'od_remark', e.target.value)}
                          />
                        </TableCell>
                        <TableCell>
                          {orderItems.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeOrderItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <Button
                  type="button"
                  variant="outline"
                  onClick={addOrderItem}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  新增商品項目
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CreateOrderPage;