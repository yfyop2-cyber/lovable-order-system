import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

type OrderDetail = Tables<'sale_order_d'>;

interface PickupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderId: string;
  onSuccess: () => void;
}

export const PickupDialog = ({ open, onOpenChange, orderId, onSuccess }: PickupDialogProps) => {
  const [orderDetails, setOrderDetails] = useState<OrderDetail[]>([]);
  const [pickupQuantities, setPickupQuantities] = useState<{ [key: number]: number }>({});
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('sale_order_d')
        .select('*')
        .eq('od_id', orderId)
        .order('recno');

      if (error) throw error;

      setOrderDetails(data || []);
      
      // Initialize pickup quantities
      const quantities: { [key: number]: number } = {};
      data?.forEach(detail => {
        quantities[detail.recno] = detail.od_pick_qty || 0;
      });
      setPickupQuantities(quantities);
    } catch (error) {
      console.error('Error fetching order details:', error);
      toast({
        title: "錯誤",
        description: "無法載入訂單明細",
        variant: "destructive",
      });
    }
  };

  const updatePickupQuantity = (recno: number, quantity: number) => {
    setPickupQuantities(prev => ({
      ...prev,
      [recno]: quantity
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const updates = orderDetails.map(detail => {
        const pickupQty = pickupQuantities[detail.recno] || 0;
        const remainingQty = detail.od_qty - pickupQty;
        
        let status = '未取';
        if (pickupQty === 0) {
          status = '未取';
        } else if (remainingQty === 0) {
          status = '已取完';
        } else {
          status = '部分取貨';
        }

        return {
          recno: detail.recno,
          od_pick_qty: pickupQty,
          odd_status: status
        };
      });

      for (const update of updates) {
        const { error } = await supabase
          .from('sale_order_d')
          .update({
            od_pick_qty: update.od_pick_qty,
            odd_status: update.odd_status
          })
          .eq('recno', update.recno);

        if (error) throw error;
      }

      // Update order header status
      const allCompleted = orderDetails.every(detail => {
        const pickupQty = pickupQuantities[detail.recno] || 0;
        return pickupQty === detail.od_qty;
      });

      const anyPickedUp = Object.values(pickupQuantities).some(qty => qty > 0);

      let orderStatus = 'pending';
      if (allCompleted) {
        orderStatus = 'completed';
      } else if (anyPickedUp) {
        orderStatus = 'processing';
      }

      const { error: headerError } = await supabase
        .from('sale_order_h')
        .update({ od_status: orderStatus })
        .eq('od_id', orderId);

      if (headerError) throw headerError;

      toast({
        title: "成功",
        description: "取貨記錄更新成功",
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating pickup:', error);
      toast({
        title: "錯誤",
        description: "更新取貨記錄失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (detail: OrderDetail, pickupQty: number) => {
    const remainingQty = detail.od_qty - pickupQty;
    
    if (pickupQty === 0) {
      return <Badge variant="secondary">未取</Badge>;
    } else if (remainingQty === 0) {
      return <Badge variant="default" className="bg-green-600">已取完</Badge>;
    } else {
      return <Badge variant="outline">部分取貨</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            取貨登記 - {orderId}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {orderDetails.map((detail) => {
            const pickupQty = pickupQuantities[detail.recno] || 0;
            const remainingQty = detail.od_qty - pickupQty;
            
            return (
              <Card key={detail.recno}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{detail.p_name}</h4>
                      <p className="text-sm text-muted-foreground">
                        商品編號: {detail.p_no} | 商品類別: {detail.p_kind}
                      </p>
                    </div>
                    {getStatusBadge(detail, pickupQty)}
                  </div>
                  
                  <div className="grid grid-cols-4 gap-4 items-end">
                    <div>
                      <Label className="text-sm">訂購數量</Label>
                      <p className="text-lg font-medium">{detail.od_qty}</p>
                    </div>
                    
                    <div>
                      <Label className="text-sm">已取數量</Label>
                      <p className="text-lg font-medium text-green-600">{detail.od_pick_qty || 0}</p>
                    </div>
                    
                    <div>
                      <Label htmlFor={`pickup-${detail.recno}`}>本次取貨</Label>
                      <Input
                        id={`pickup-${detail.recno}`}
                        type="number"
                        min="0"
                        max={remainingQty}
                        value={pickupQty}
                        onChange={(e) => updatePickupQuantity(detail.recno, parseInt(e.target.value) || 0)}
                      />
                    </div>
                    
                    <div>
                      <Label className="text-sm">剩餘數量</Label>
                      <p className="text-lg font-medium text-orange-600">{remainingQty}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePickupQuantity(detail.recno, remainingQty)}
                      disabled={remainingQty === 0}
                    >
                      全部取完
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updatePickupQuantity(detail.recno, 0)}
                    >
                      重設
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {orderDetails.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              暫無訂單明細
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              {isLoading ? "更新中..." : "確認取貨"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};