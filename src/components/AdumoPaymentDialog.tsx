import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, CreditCard, RefreshCw, XCircle } from 'lucide-react';
import { AdumoPaymentService } from '@/services/adumoService';
import { AdumoSettings, AdumoTransactionResult } from '@/types/adumo';

interface AdumoPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  amount: number;
  customerName?: string;
  reference: string;
  settings: AdumoSettings;
  onSuccess: (result: AdumoTransactionResult) => void;
  onCancel?: () => void;
}

type DialogStage = 'idle' | 'processing' | 'approved' | 'declined';

export const AdumoPaymentDialog: React.FC<AdumoPaymentDialogProps> = ({
  open,
  onOpenChange,
  amount,
  customerName,
  reference,
  settings,
  onSuccess,
  onCancel,
}) => {
  const [stage, setStage] = useState<DialogStage>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('Ready to initiate Adumo transaction.');
  const [result, setResult] = useState<AdumoTransactionResult | null>(null);
  const [progress, setProgress] = useState<number>(10);

  useEffect(() => {
    if (open) {
      setStage('processing');
      setProgress(15);
      setStatusMessage('Sending transaction request to Adumo...');

      let currentProgress = 20;
      const progressTimer = setInterval(() => {
        currentProgress = Math.min(currentProgress + 15, 90);
        setProgress(currentProgress);
      }, 900);

      AdumoPaymentService.processTransaction(
        {
          amount,
          reference,
          customerName,
        },
        settings,
        (msg) => {
          setStatusMessage(msg);
        }
      )
        .then((res) => {
          clearInterval(progressTimer);
          setResult(res);
          if (res.success) {
            setProgress(100);
            setStage('approved');
            // Auto complete after short delay to show approval
            setTimeout(() => {
              onSuccess(res);
              onOpenChange(false);
            }, 1400);
          } else {
            setStage('declined');
          }
        })
        .catch((err) => {
          clearInterval(progressTimer);
          setStage('declined');
          setStatusMessage(err?.message || 'Transaction failed. Unable to communicate with Adumo.');
        });

      return () => {
        clearInterval(progressTimer);
      };
    } else {
      setStage('idle');
      setResult(null);
      setProgress(10);
    }
  }, [open]);

  const handleRetry = () => {
    setStage('processing');
    setProgress(20);
    setStatusMessage('Retrying Adumo payment...');
    AdumoPaymentService.processTransaction(
      { amount, reference, customerName },
      settings,
      (msg) => setStatusMessage(msg)
    ).then((res) => {
      setResult(res);
      if (res.success) {
        setProgress(100);
        setStage('approved');
        setTimeout(() => {
          onSuccess(res);
          onOpenChange(false);
        }, 1200);
      } else {
        setStage('declined');
      }
    });
  };

  const handleManualOverride = () => {
    const manualResult: AdumoTransactionResult = {
      success: true,
      transactionId: `OVERRIDE-${Date.now()}`,
      reference,
      amount,
      authCode: 'MANUAL',
      terminalId: settings.terminalId,
      statusMessage: 'APPROVED - MANUAL STANDALONE OVERRIDE',
      timestamp: new Date().toISOString(),
    };
    onSuccess(manualResult);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Adumo Pay
            </DialogTitle>
            <Badge variant={settings.environment === 'sandbox' ? 'outline' : 'default'} className="uppercase">
              {settings.environment === 'sandbox' ? 'Sandbox Mode' : 'Live Terminal'}
            </Badge>
          </div>
          <DialogDescription>
            {settings.mode === 'terminal'
              ? `Integrated Smart Terminal (${settings.terminalId})`
              : 'Adumo Online Payment Gateway'}
          </DialogDescription>
        </DialogHeader>

        <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
          <div className="p-3 bg-muted rounded-full">
            {stage === 'processing' && <Loader2 className="h-10 w-10 text-primary animate-spin" />}
            {stage === 'approved' && <CheckCircle2 className="h-10 w-10 text-green-600 animate-bounce" />}
            {stage === 'declined' && <AlertCircle className="h-10 w-10 text-destructive" />}
            {stage === 'idle' && <CreditCard className="h-10 w-10 text-muted-foreground" />}
          </div>

          <div>
            <span className="text-sm text-muted-foreground">Total Amount</span>
            <h2 className="text-3xl font-extrabold text-foreground tracking-tight">R{amount.toFixed(2)}</h2>
            <p className="text-xs text-muted-foreground mt-1">Ref: {reference}</p>
          </div>

          <div className="w-full space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Status</span>
              <span>{stage.toUpperCase()}</span>
            </div>
            <Progress value={progress} className="h-2" />
            <p className="text-sm font-medium text-foreground min-h-[40px] flex items-center justify-center px-4">
              {statusMessage}
            </p>
          </div>

          {result?.authCode && (
            <div className="w-full bg-accent/50 p-2 rounded text-xs text-left space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Auth Code:</span>
                <span className="font-mono font-semibold">{result.authCode}</span>
              </div>
              {result.maskedPan && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Card:</span>
                  <span className="font-mono">{result.maskedPan}</span>
                </div>
              )}
              {result.rrn && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">RRN:</span>
                  <span className="font-mono">{result.rrn}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {stage === 'processing' && (
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => {
                onCancel?.();
                onOpenChange(false);
              }}
            >
              Cancel Transaction
            </Button>
          )}

          {stage === 'declined' && (
            <>
              <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                <XCircle className="h-4 w-4 mr-2" />
                Close
              </Button>
              <Button variant="secondary" className="w-full" onClick={handleManualOverride}>
                Manual Terminal Approval
              </Button>
              <Button className="w-full" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry Terminal
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
