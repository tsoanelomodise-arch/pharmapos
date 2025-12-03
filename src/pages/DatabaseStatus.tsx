import { Button } from '@/components/ui/button';
import { ArrowLeft, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const DatabaseStatus = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Database className="h-8 w-8" />
            Database Status
          </h1>
          <p className="text-muted-foreground mt-1">
            Monitor the real-time status of our database infrastructure
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link to="/help">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Help
          </Link>
        </Button>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
        <iframe
          src="https://status.supabase.com/"
          title="Database Status"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin"
        />
      </div>
    </div>
  );
};

export default DatabaseStatus;
