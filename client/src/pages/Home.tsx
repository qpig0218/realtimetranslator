import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Loader2, Plus, Languages, Clock, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: sessions, isLoading: sessionsLoading } =
    trpc.translation.getUserSessions.useQuery(undefined, {
      enabled: !!user,
    });

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              {APP_LOGO && (
                <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-20 object-contain" />
              )}
            </div>
            <h1 className="text-5xl font-bold text-gray-900 leading-tight">
              {APP_TITLE}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              即時語音辨識與翻譯,支援多種語言與專業場景,自動生成逐字稿與 AI 摘要
            </p>

            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <a href={getLoginUrl()}>立即開始</a>
              </Button>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
              <Card>
                <CardHeader>
                  <Languages className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>即時翻譯</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    支援繁體中文、英文、日文等多種語言,即時語音辨識與翻譯
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>專業場景</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    針對醫療、法律、商務等專業領域優化翻譯準確度
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>智能摘要</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    會話結束後自動生成逐字稿,並使用 AI 生成結構化摘要
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的翻譯會話</h1>
              <p className="text-muted-foreground mt-1">管理您的即時翻譯記錄</p>
            </div>
            <Button onClick={() => setLocation("/new-session")} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              新會話
            </Button>
          </div>

          {/* Sessions List */}
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card
                  key={session.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => {
                    if (session.status === "active") {
                      setLocation(`/session/${session.id}`);
                    } else {
                      setLocation(`/summary/${session.id}`);
                    }
                  }}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl">{session.title}</CardTitle>
                        <CardDescription className="mt-2">
                          {session.sourceLanguage} → {session.targetLanguage}
                          {session.scenario && ` | ${session.scenario}`}
                        </CardDescription>
                      </div>
                      <Badge
                        variant={
                          session.status === "active"
                            ? "default"
                            : session.status === "completed"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {session.status === "active"
                          ? "進行中"
                          : session.status === "completed"
                          ? "已完成"
                          : "已封存"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(session.startedAt).toLocaleString()}</span>
                      </div>
                      {session.endedAt && (
                        <div className="flex items-center gap-1">
                          <span>結束於 {new Date(session.endedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center space-y-4">
                  <Languages className="h-16 w-16 text-muted-foreground mx-auto" />
                  <div>
                    <p className="text-lg font-medium text-gray-900">尚無翻譯會話</p>
                    <p className="text-muted-foreground mt-1">
                      點擊上方按鈕建立您的第一個翻譯會話
                    </p>
                  </div>
                  <Button onClick={() => setLocation("/new-session")}>
                    <Plus className="mr-2 h-4 w-4" />
                    建立新會話
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
