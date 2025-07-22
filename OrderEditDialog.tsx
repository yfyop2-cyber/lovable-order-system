import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Edit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type Customer = Tables<'customers'>;
type Store = Tables<'stores'>;
type Part = Tables<'part'>;
type OrderHeader = Tables<'sale_order_h'>;
type OrderDetail = Tables<'sale_order_d'>;

interface OrderEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess: () => void;
}

export const OrderEditDialog = ({ open, onOpenChange, orderId, onSuccess }: OrderEditDialogProps) => {
  const [order, setOrder] = useState<OrderHeader | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [selectedStore, setSelectedStore] = useState<string>("");
  const [pickupDate, setPickupDate] = useState<string>("");
  const [remark, setRemark] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderData();
      fetchMasterData();
    }
  }, [open, orderId]);

  const fetchOrderData = async () => {
    try {
      const [headerRes, detailsRes] = await Promise.all([
        supabase.from('sale_order_h').select('*').eq('od_id', orderId).single(),
        supabase.from('sale_order_d').select('*').eq('od_id', orderId).order('recno')
      ]);

      if (headerRes.data) {
        setOrder(headerRes.data);
        setSelectedCustomer(headerRes.data.c_id?.toString() || "");
        setSelectedStore(headerRes.data.s_no || "");
        setPickupDate(headerRes.data.od_pkdate || "");
        setRemark(headerRes.data.od_remark || "");
      }

      if (detailsRes.data) {
        setOrderDetails(detailsRes.data);
      }
    } catch (error) {
      console.error('Error fetching order data:', error);
      toast({
        title: "錯誤",
        description: "無法載入訂單資料",
        variant: "destructive",
      });
    }
  };

  const fetchMasterData = async () => {
    try {
      const [customersRes, storesRes, partsRes] = await Promise.all([
        supabase.from('customers').select('*').order('c_name'),
        supabase.from('stores').select('*').eq('status', 1).order('s_name'),
        supabase.from('part').select('*').eq('p_status', 1).order('p_name')
      ]);

      if (customersRes.data) setCustomers(customersRes.data);
      if (storesRes.data) setStores(storesRes.data);
      if (partsRes.data) setParts(partsRes.data);
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const addOrderItem = () => {
    const newItem: OrderDetail = {
      recno: Date.now(), // Temporary ID for new items
      od_id: orderId,
      p_no: "",
      p_name: "",
      p_kind: "",
      od_qty: 1,
      od_pick_qty: 0,
      odd_status: '未取'
    };
    setOrderDetails([...orderDetails, newItem]);
  };

  const removeOrderItem = async (recno: number) => {
    // If it's an existing item (has a real recno), delete from database
    if (recno < 1000000000000) { // Not a temporary ID
      try {
        const { error } = await supabase
          .from('sale_order_d')
          .delete()
          .eq('recno', recno);

        if (error) throw error;
      } catch (error) {
        console.error('Error deleting order item:', error);
        toast({
          title: "錯誤",
          description: "刪除商品失敗",
          variant: "destructive",
        });
        return;
      }
    }
    
    setOrderDetails(orderDetails.filter(item => item.recno !== recno));
  };

  const updateOrderItem = (recno: number, field: keyof OrderDetail, value: string | number) => {
    const updated = [...orderDetails];
    const itemIndex = updated.findIndex(item => item.recno === recno);
    
    if (itemIndex >= 0) {
      if (field === 'p_no') {
        const part = parts.find(p => p.p_no === value);
        if (part) {
          updated[itemIndex] = { 
            ...updated[itemIndex], 
            p_no: value as string, 
            p_name: part.p_name,
            p_kind: part.p_kind || null
          };
        }
      } else {
        updated[itemIndex] = { ...updated[itemIndex], [field]: value };
      }
      setOrderDetails(updated);
    }
  };

  const canEdit = () => {
    return order?.od_status === 'pending' || order?.od_status === null;
  };

  const hasPickedItems = () => {
    return orderDetails.some(item => (item.od_pick_qty || 0) > 0);
  };

  const handleSubmit = async () => {
    if (!canEdit()) {
      toast({
        title: "錯誤",
        description: "此訂單狀態不允許編輯",
        variant: "destructive",
      });
      return;
    }

    if (!selectedCustomer || !selectedStore || orderDetails.length === 0) {
      toast({
        title: "錯誤",
        description: "請填寫所有必要欄位",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Update order header
      const { error: headerError } = await supabase
        .from('sale_order_h')
        .update({
          c_id: parseInt(selectedCustomer),
          s_no: selectedStore,
          od_pkdate: pickupDate || null,
          od_remark: remark || null,
          od_update: new Date().toISOString().split('T')[0]
        })
        .eq('od_id', orderId);

      if (headerError) throw headerError;

      // Handle order details
      for (const detail of orderDetails) {
        if (detail.recno >= 1000000000000) { // New item
          const { error } = await supabase
            .from('sale_order_d')
            .insert({
              od_id: orderId,
              p_no: detail.p_no,
              p_name: detail.p_name,
              p_kind: detail.p_kind,
              od_qty: detail.od_qty,
              od_pick_qty: 0,
              odd_status: '未取'
            });

          if (error) throw error;
        } else { // Existing item
          const { error } = await supabase
            .from('sale_order_d')
            .update({
              p_no: detail.p_no,
              p_name: detail.p_name,
              p_kind: detail.p_kind,
              od_qty: detail.od_qty
            })
            .eq('recno', detail.recno);

          if (error) throw error;
        }
      }

      toast({
        title: "成功",
        description: "訂單更新成功",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "錯誤",
        description: "更新訂單失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getItemStatus = (item: OrderDetail) => {
    const pickupQty = item.od_pick_qty || 0;
    if (pickupQty === 0) {
      return <Badge variant="secondary">未取</Badge>;
    } else if (pickupQty >= item.od_qty) {
      return <Badge className="bg-green-600">已取完</Badge>;
    } else {
      return <Badge variant="outline">部分取貨</Badge>;
    }
  };

  if (!order) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            編輯訂單 - {orderId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {!canEdit() && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-yellow-800">
                注意：此訂單已有取貨記錄或已完成，僅能查看不能編輯
              </p>
            </div>
          )}

          {/* Customer and Store Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>客戶</Label>
              <Select 
                value={selectedCustomer} 
                onValueChange={setSelectedCustomer}
                disabled={!canEdit()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇客戶" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map(customer => (
                    <SelectItem key={customer.c_id} value={customer.c_id.toString()}>
                      {customer.c_name} ({customer.c_phone})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>門市</Label>
              <Select 
                value={selectedStore} 
                onValueChange={setSelectedStore}
                disabled={!canEdit()}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇門市" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.s_no} value={store.s_no}>
                      {store.s_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Pickup Date and Remark */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>預約取貨日期</Label>
              <Input
                type="date"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                disabled={!canEdit()}
              />
            </div>
            
            <div className="space-y-2">
              <Label>備註</Label>
              <Textarea
                placeholder="訂單備註"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                disabled={!canEdit()}
              />
            </div>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>訂單明細</CardTitle>
                {canEdit() && (
                  <Button variant="outline" size="sm" onClick={addOrderItem}>
                    <Plus className="h-4 w-4 mr-2" />
                    添加商品
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderDetails.map((item) => (
                  <div key={item.recno} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1">
                      <Label>商品</Label>
                      <Select 
                        value={item.p_no || ""} 
                        onValueChange={(value) => updateOrderItem(item.recno, 'p_no', value)}
                        disabled={!canEdit() || (item.od_pick_qty || 0) > 0}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇商品" />
                        </SelectTrigger>
                        <SelectContent>
                          {parts.map(part => (
                            <SelectItem key={part.p_no} value={part.p_no}>
                              {part.p_name} ({part.p_kind}) - NT${part.p_price}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="w-24">
                      <Label>數量</Label>
                      <Input
                        type="number"
                        min="1"
                        value={item.od_qty}
                        onChange={(e) => updateOrderItem(item.recno, 'od_qty', parseInt(e.target.value) || 1)}
                        disabled={!canEdit() || (item.od_pick_qty || 0) > 0}
                      />
                    </div>

                    <div className="w-24">
                      <Label>已取</Label>
                      <p className="text-sm font-medium text-green-600 p-2">
                        {item.od_pick_qty || 0}
                      </p>
                    </div>

                    <div className="w-32">
                      {getItemStatus(item)}
                    </div>
                    
                    {canEdit() && (item.od_pick_qty || 0) === 0 && (
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => removeOrderItem(item.recno)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                
                {orderDetails.length === 0 && (
                  <p className="text-muted-foreground text-center py-4">
                    尚無商品明細
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {canEdit() ? "取消" : "關閉"}
            </Button>
            {canEdit() && (
              <Button onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? "更新中..." : "更新訂單"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};