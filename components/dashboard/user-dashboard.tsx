'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { FileStorageService } from '@/lib/file-storage';
import { type DbFile } from '@/lib/database-schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Files, 
  HardDrive, 
  Upload, 
  Download, 
  Share2, 
  Eye,
  TrendingUp,
  Activity,
  Calendar,
  Clock,
  User,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Code,
  BarChart3,
  PieChart,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart as RechartsPieChart, 
  Cell 
} from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';

interface StorageUsage {
  used: number;
  quota: number;
  fileCount: number;
}

interface ActivityData {
  date: string;
  uploads: number;
  downloads: number;
}

interface FileTypeData {
  type: string;
  count: number;
  size: number;
  color: string;
}

interface DashboardStats {
  totalFiles: number;
  totalStorage: number;
  recentUploads: number;
  recentDownloads: number;
  sharedFiles: number;
  storageUsed: number;
  storageQuota: number;
}

const FILE_TYPE_COLORS = {
  image: '#3b82f6',
  video: '#ef4444',
  audio: '#8b5cf6',
  document: '#10b981',
  archive: '#f59e0b',
  text: '#6b7280',
  other: '#8b5cf6',
};

export function UserDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    totalStorage: 0,
    recentUploads: 0,
    recentDownloads: 0,
    sharedFiles: 0,
    storageUsed: 0,
    storageQuota: 0,
  });
  const [recentFiles, setRecentFiles] = useState<DbFile[]>([]);
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [fileTypeData, setFileTypeData] = useState<FileTypeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Load storage usage
      const storageUsage = await FileStorageService.getStorageUsage(user.id);
      
      // Load recent files
      const files = await FileStorageService.listFiles({
        userId: user.id,
        limit: 20,
      });

      // Calculate stats
      const sharedFiles = files.filter(f => f.is_public || f.share_token).length;
      const last7Days = subDays(new Date(), 7);
      const recentUploads = files.filter(f => new Date(f.created_at) > last7Days).length;

      // Group files by type
      const fileTypes = files.reduce((acc, file) => {
        const type = file.file_type || 'other';
        if (!acc[type]) {
          acc[type] = { count: 0, size: 0 };
        }
        acc[type].count++;
        acc[type].size += file.size || 0;
        return acc;
      }, {} as Record<string, { count: number; size: number }>);

      const fileTypeData = Object.entries(fileTypes).map(([type, data]) => ({
        type,
        count: data.count,
        size: data.size,
        color: FILE_TYPE_COLORS[type as keyof typeof FILE_TYPE_COLORS] || FILE_TYPE_COLORS.other,
      }));

      // Generate activity data for last 7 days
      const activityData = Array.from({ length: 7 }, (_, i) => {
        const date = subDays(new Date(), 6 - i);
        const dayFiles = files.filter(f => 
          startOfDay(new Date(f.created_at)).getTime() === startOfDay(date).getTime()
        );
        
        return {
          date: format(date, 'MMM dd'),
          uploads: dayFiles.length,
          downloads: Math.floor(Math.random() * 20), // Mock data for downloads
        };
      });

      setStats({
        totalFiles: storageUsage.fileCount,
        totalStorage: storageUsage.used,
        recentUploads,
        recentDownloads: Math.floor(Math.random() * 50), // Mock data
        sharedFiles,
        storageUsed: storageUsage.used,
        storageQuota: storageUsage.quota,
      });

      setRecentFiles(files.slice(0, 10));
      setActivityData(activityData);
      setFileTypeData(fileTypeData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string | null) => {
    switch (fileType) {
      case 'image': return <Image className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'audio': return <Music className="w-4 h-4" />;
      case 'document': return <FileText className="w-4 h-4" />;
      case 'archive': return <Archive className="w-4 h-4" />;
      case 'text': return <Code className="w-4 h-4" />;
      default: return <Files className="w-4 h-4" />;
    }
  };

  const getStoragePercentage = () => {
    if (stats.storageQuota === 0) return 0;
    return Math.round((stats.storageUsed / stats.storageQuota) * 100);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin mr-2" />
        Loading dashboard...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-950/50 dark:to-cyan-950/50 border-blue-200/50 dark:border-blue-800/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Total Files</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Files className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalFiles}</div>
            <p className="text-xs text-blue-600 dark:text-blue-400">
              +{stats.recentUploads} this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/50 dark:to-emerald-950/50 border-green-200/50 dark:border-green-800/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Storage Used</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <HardDrive className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">{formatFileSize(stats.storageUsed)}</div>
            <p className="text-xs text-green-600 dark:text-green-400">
              {getStoragePercentage()}% of {formatFileSize(stats.storageQuota)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-950/50 dark:to-violet-950/50 border-purple-200/50 dark:border-purple-800/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Shared Files</CardTitle>
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Share2 className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.sharedFiles}</div>
            <p className="text-xs text-purple-600 dark:text-purple-400">
              Public or shared links
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-950/50 dark:to-amber-950/50 border-orange-200/50 dark:border-orange-800/50 hover:shadow-lg transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">Recent Activity</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats.recentUploads}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400">
              Uploads this week
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Storage Usage */}
      <Card className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950/50 dark:to-gray-950/50 border-slate-200/50 dark:border-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
            <div className="p-2 bg-slate-500/10 rounded-lg">
              <HardDrive className="w-5 h-5 text-slate-500" />
            </div>
            Storage Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm font-medium">
              <span className="text-slate-700 dark:text-slate-300">{formatFileSize(stats.storageUsed)} used</span>
              <span className="text-slate-500 dark:text-slate-400">{formatFileSize(stats.storageQuota)} total</span>
            </div>
            <Progress value={getStoragePercentage()} className="h-3 bg-slate-200 dark:bg-slate-800" />
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>{stats.totalFiles} files</span>
              <span>{getStoragePercentage()}% used</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Activity Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="uploads" fill="#3b82f6" name="Uploads" />
                <Bar dataKey="downloads" fill="#10b981" name="Downloads" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* File Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              File Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fileTypeData.map((item, index) => (
                <div key={item.type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm capitalize">{item.type}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div>{item.count} files</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(item.size)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Files */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Files
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentFiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Files className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Upload your first file to see it here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFileIcon(file.file_type)}
                    <div>
                      <p className="font-medium">{file.original_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size || 0)}</span>
                        <span>•</span>
                        <span>{format(new Date(file.created_at), 'MMM dd, yyyy')}</span>
                        {file.is_public && (
                          <>
                            <span>•</span>
                            <Badge variant="secondary" className="text-xs">Public</Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="w-4 h-4" />
                    </Button>
                    {file.share_token && (
                      <Button size="sm" variant="outline">
                        <Share2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button className="h-20 flex-col" variant="outline">
              <Upload className="w-6 h-6 mb-2" />
              <span>Upload Files</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <FileText className="w-6 h-6 mb-2" />
              <span>Create Document</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <Share2 className="w-6 h-6 mb-2" />
              <span>Share Files</span>
            </Button>
            <Button className="h-20 flex-col" variant="outline">
              <User className="w-6 h-6 mb-2" />
              <span>Account Settings</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default UserDashboard;
