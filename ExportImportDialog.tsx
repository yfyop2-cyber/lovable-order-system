import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, FileText, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ExportImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportImportDialog = ({ open, onOpenChange }: ExportImportDialogProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const exportProducts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('part')
        .select('*')
        .order('p_name');

      if (error) throw error;

      const csvContent = [
        // CSV header
        'p_no,p_name,p_price,p_kind,p_bom,p_date_s,p_date_e,p_status,cre_date',
        // CSV data
        ...data.map(item => [
          item.p_no,
          `"${item.p_name}"`,
          item.p_price,
          `"${item.p_kind || ''}"`,
          item.p_bom || false,
          item.p_date_s || '',
          item.p_date_e || '',
          item.p_status,
          item.cre_date || ''
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `products_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      toast({
        title: "成功",
        description: `已匯出 ${data.length} 筆商品資料`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "錯誤",
        description: "匯出商品資料失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCustomers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('c_name');

      if (error) throw error;

      const csvContent = [
        // CSV header
        'c_id,c_name,c_phone,c_no,c_remark,cc_no',
        // CSV data
        ...data.map(item => [
          item.c_id,
          `"${item.c_name}"`,
          `"${item.c_phone}"`,
          `"${item.c_no || ''}"`,
          `"${item.c_remark || ''}"`,
          `"${item.cc_no || ''}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `customers_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();

      toast({
        title: "成功",
        description: `已匯出 ${data.length} 筆客戶資料`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "錯誤",
        description: "匯出客戶資料失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importProducts = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const header = lines[0].split(',');
      
      if (!header.includes('p_name') || !header.includes('p_price')) {
        throw new Error('CSV 格式錯誤：缺少必要欄位 p_name 或 p_price');
      }

      const products = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= header.length) {
          const product: any = {};
          header.forEach((col, index) => {
            let value = values[index]?.replace(/^"|"$/g, '').trim();
            if (col === 'p_price') {
              product[col] = parseFloat(value) || 0;
            } else if (col === 'p_status') {
              product[col] = parseInt(value) || 1;
            } else if (col === 'p_bom') {
              product[col] = value === 'true';
            } else if (value) {
              product[col] = value;
            }
          });
          
          if (product.p_name) {
            // Include p_no if provided in import data, otherwise let database generate it
            const productData: any = {
              p_name: product.p_name,
              p_price: product.p_price || 0,
              p_kind: product.p_kind || '常態',
              p_status: product.p_status || 1,
              p_bom: product.p_bom || false
            };
            
            // Only include p_no if it exists in the import data
            if (product.p_no) {
              productData.p_no = product.p_no;
            }
            
            products.push(productData);
          }
        }
      }

      if (products.length === 0) {
        throw new Error('沒有有效的商品資料');
      }

      const { error } = await supabase
        .from('part')
        .insert(products);

      if (error) throw error;

      toast({
        title: "成功",
        description: `已匯入 ${products.length} 筆商品資料`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "錯誤",
        description: error instanceof Error ? error.message : "匯入商品資料失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const importCustomers = async (file: File) => {
    setIsLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const header = lines[0].split(',');
      
      if (!header.includes('c_name') || !header.includes('c_phone')) {
        throw new Error('CSV 格式錯誤：缺少必要欄位 c_name 或 c_phone');
      }

      const customers = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        if (values.length >= header.length) {
          const customer: any = {};
          header.forEach((col, index) => {
            const value = values[index]?.replace(/^"|"$/g, '').trim();
            if (value && col !== 'c_id') { // Skip c_id as it's auto-generated
              customer[col] = value;
            }
          });
          
          if (customer.c_name && customer.c_phone) {
            customers.push({
              c_name: customer.c_name,
              c_phone: customer.c_phone,
              c_no: customer.c_no || null,
              c_remark: customer.c_remark || null,
              cc_no: customer.cc_no || null
            });
          }
        }
      }

      if (customers.length === 0) {
        throw new Error('沒有有效的客戶資料');
      }

      const { error } = await supabase
        .from('customers')
        .insert(customers);

      if (error) throw error;

      toast({
        title: "成功",
        description: `已匯入 ${customers.length} 筆客戶資料`,
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "錯誤",
        description: error instanceof Error ? error.message : "匯入客戶資料失敗",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = (type: 'products' | 'customers') => (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      if (type === 'products') {
        importProducts(file);
      } else {
        importCustomers(file);
      }
    } else {
      toast({
        title: "錯誤",
        description: "請選擇 CSV 格式檔案",
        variant: "destructive",
      });
    }
    // Reset input
    event.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>匯入/匯出資料</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">匯出資料</TabsTrigger>
            <TabsTrigger value="import">匯入資料</TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    商品資料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    匯出所有商品資料為 CSV 格式
                  </p>
                  <Button 
                    onClick={exportProducts} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    匯出商品
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    客戶資料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    匯出所有客戶資料為 CSV 格式
                  </p>
                  <Button 
                    onClick={exportCustomers} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    匯出客戶
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    商品資料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    匯入 CSV 格式的商品資料<br/>
                    必要欄位：p_name, p_price
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="products-file">選擇 CSV 檔案</Label>
                    <Input
                      id="products-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload('products')}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    客戶資料
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    匯入 CSV 格式的客戶資料<br/>
                    必要欄位：c_name, c_phone
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="customers-file">選擇 CSV 檔案</Label>
                    <Input
                      id="customers-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload('customers')}
                      disabled={isLoading}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            關閉
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};