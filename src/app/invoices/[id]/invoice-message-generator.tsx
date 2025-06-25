'use client';

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { generateInvoiceMessage, type InvoiceMessageInput, type InvoiceMessageOutput } from '@/ai/flows/invoice-message-generation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type InvoiceMessageGeneratorProps = {
  input: InvoiceMessageInput;
};

export function InvoiceMessageGenerator({ input }: InvoiceMessageGeneratorProps) {
  const [result, setResult] = useState<InvoiceMessageOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const output = await generateInvoiceMessage(input);
      setResult(output);
    } catch (e) {
      setError('Failed to generate message. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalized Thank You Note</CardTitle>
        <CardDescription>Use AI to generate a personalized message for this invoice.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button onClick={handleGenerate} disabled={isLoading}>
            <Sparkles className="mr-2 h-4 w-4" />
            {isLoading ? 'Generating...' : 'Generate Message'}
          </Button>

          {isLoading && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          )}

          {error && <Alert variant="destructive">{error}</Alert>}

          {result && result.isAppropriate && (
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>Generated Message</AlertTitle>
              <AlertDescription className="prose dark:prose-invert">
                <p>{result.message}</p>
              </AlertDescription>
            </Alert>
          )}

          {result && !result.isAppropriate && (
            <Alert>
              <Bot className="h-4 w-4" />
              <AlertTitle>Message Not Generated</AlertTitle>
              <AlertDescription>
                AI determined that a personalized message might not be appropriate for this order.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
