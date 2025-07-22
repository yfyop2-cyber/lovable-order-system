import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomerCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CustomerCreateDialog = ({ open, onOpenChange, onSuccess }: CustomerCreateDialogProps) => {
  const [formData, setFormData] = useState({
    c_name: "",
    c_phone: "",
    c_no: "",
    cc_no: "",
    c_remark: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!formData.c_name || !formData.c_phone) {
      toast({
        title: "錯誤",
        description: "請填寫客戶名稱和電話",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('customers')
        .insert([{
          c_name: formData.c_name,
          c_phone: formData.c_phone,
          c_no: formData.c_no || null,
          cc_no: formData.cc_no || null,
          c_remark: formData.c_remark || null
        }]);

      if (error) throw error;

      toast({
        title: "成功",
        description: "客戶建立成功",
      });

      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error creating customer:', error);
      toast({
        title: "錯誤",
        description: "建立客戶失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      c_name: "",
      c_phone: "",
      c_no: "",
      cc_no: "",
      c_remark: ""
    });
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>快速新增客戶</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>客戶名稱 *</Label>
            <Input
              value={formData.c_name}
              onChange={(e) => handleInputChange('c_name', e.target.value)}
              placeholder="請輸入客戶名稱"
            />
          </div>

          <div className="space-y-2">
            <Label>電話 *</Label>
            <Input
              value={formData.c_phone}
              onChange={(e) => handleInputChange('c_phone', e.target.value)}
              placeholder="請輸入電話號碼"
            />
          </div>

          <div className="space-y-2">
            <Label>統一編號</Label>
            <Input
              value={formData.c_no}
              onChange={(e) => handleInputChange('c_no', e.target.value)}
              placeholder="請輸入統一編號"
            />
          </div>

          <div className="space-y-2">
            <Label>信用卡號</Label>
            <Input
              value={formData.cc_no}
              onChange={(e) => handleInputChange('cc_no', e.target.value)}
              placeholder="請輸入信用卡號"
            />
          </div>

          <div className="space-y-2">
            <Label>備註</Label>
            <Textarea
              value={formData.c_remark}
              onChange={(e) => handleInputChange('c_remark', e.target.value)}
              placeholder="客戶備註"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "建立中..." : "建立客戶"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};