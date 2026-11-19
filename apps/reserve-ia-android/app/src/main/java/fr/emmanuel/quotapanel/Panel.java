package fr.emmanuel.quotapanel;

import android.app.*;
import android.app.job.*;
import android.content.*;
import android.os.Build;
import org.json.*;
import java.net.*;
import java.io.*;
import java.nio.charset.StandardCharsets;
import java.text.DateFormat;
import java.util.Date;

final class Panel {
    static final int JOB = 41, NOTE = 42;
    static android.content.SharedPreferences prefs(Context c) { return c.getSharedPreferences("panel",0); }
    static void schedule(Context c) {
        JobInfo info = new JobInfo.Builder(JOB,new ComponentName(c,QuotaJob.class))
            .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPeriodic(15*60*1000L).setPersisted(true).build();
        if(c.getSystemService(JobScheduler.class).schedule(info)!=JobScheduler.RESULT_SUCCESS)
            throw new IllegalStateException("Planification refusée par Android");
    }
    static String time(long seconds) { return DateFormat.getDateTimeInstance(DateFormat.SHORT,DateFormat.SHORT).format(new Date(seconds*1000)); }
    static String describe(JSONObject data) throws JSONException {
        long fetched = data.getLong("fetchedAt");
        StringBuilder s = new StringBuilder();
        JSONArray windows = data.getJSONArray("windows");
        if(windows.length()==0) throw new JSONException("Fenêtres absentes");
        for(int i=0;i<windows.length();i++) {
            JSONObject w=windows.getJSONObject(i);
            double left=w.getDouble("remaining");
            int mins=w.getInt("minutes"); long reset=w.getLong("resetsAt");
            if(!Double.isFinite(left)||left<0||left>100||mins<=0||reset<=0) throw new JSONException("Valeur invalide");
            String label=mins==300?"5 heures":mins==10080?"Semaine":mins+" min";
            s.append(label).append(" : ").append(left).append(" % restant\n");
            s.append(reset*1000<=System.currentTimeMillis()?"Échéance passée — actualiser":"Renouvellement : "+time(reset)).append("\n\n");
        }
        return s.append("Mesure : ").append(time(fetched)).toString();
    }
    static synchronized String refresh(Context c) {
        if(!prefs(c).getBoolean("enabled",false)) return "Suivi arrêté";
        String result;
        try {
            URI uri = URI.create(prefs(c).getString("url",""));
            if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null) throw new IOException();
            HttpURLConnection conn=(HttpURLConnection)uri.toURL().openConnection();
            conn.setConnectTimeout(15000); conn.setReadTimeout(25000); conn.setInstanceFollowRedirects(false);
            conn.setRequestProperty("Authorization","Bearer "+SecretStore.get(c));
            try {
                if(conn.getResponseCode()!=200) throw new IOException();
                ByteArrayOutputStream bytes=new ByteArrayOutputStream();
                try(InputStream in=conn.getInputStream()) {
                    byte[] b=new byte[2048]; int n;
                    while((n=in.read(b))!=-1) { if(bytes.size()+n>65536) throw new IOException(); bytes.write(b,0,n); }
                }
                String raw=bytes.toString(StandardCharsets.UTF_8.name());
                JSONObject data=new JSONObject(raw);
                long fetched=data.getLong("fetchedAt"), now=System.currentTimeMillis()/1000;
                if(fetched>now+300||fetched<now-300) throw new IOException();
                result=describe(data);
                if(prefs(c).getBoolean("enabled",false)) prefs(c).edit().putString("cache",raw).apply();
            } finally {conn.disconnect();}
        } catch(Exception e) {
            result="Actualisation impossible. Vérifier le relais et la connexion.";
            try { result+="\n\nDERNIÈRES VALEURS — NON ACTUALISÉES\n"+describe(new JSONObject(prefs(c).getString("cache",""))); }
            catch(Exception ignored) { result+="\nAucune donnée disponible."; }
        }
        synchronized(Panel.class) {
            if(prefs(c).getBoolean("enabled",false)) {
                prefs(c).edit().putString("status",result).apply(); show(c,result);
            }
        }
        return result;
    }
    static void show(Context c,String text) {
        NotificationManager nm=c.getSystemService(NotificationManager.class);
        NotificationChannel ch=new NotificationChannel("quota","Suivi des quotas",NotificationManager.IMPORTANCE_LOW);
        nm.createNotificationChannel(ch);
        if(!nm.areNotificationsEnabled()) return;
        PendingIntent open=PendingIntent.getActivity(c,0,new Intent(c,MainActivity.class),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        // Activity launch is deliberate: no notification trampoline or unrestricted background service.
        PendingIntent refresh=PendingIntent.getActivity(c,1,new Intent(c,MainActivity.class).putExtra("refresh",true),PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
        Notification n=new Notification.Builder(c,"quota").setSmallIcon(fr.emmanuel.quotapanel.R.drawable.ic_quota)
            .setContentTitle("Réserve IA · Work / Codex").setContentText(text.split("\n")[0])
            .setStyle(new Notification.BigTextStyle().bigText(text)).setOnlyAlertOnce(true)
            .setVisibility(Notification.VISIBILITY_PRIVATE).setOngoing(true).setContentIntent(open)
            .addAction(new Notification.Action.Builder(null,"Actualiser",refresh).build()).build();
        try { nm.notify(NOTE,n); } catch(SecurityException ignored) { }
    }
    static synchronized void stop(Context c) {
        prefs(c).edit().putBoolean("enabled",false).putString("status","Suivi arrêté").apply();
        c.getSystemService(JobScheduler.class).cancel(JOB);
        c.getSystemService(NotificationManager.class).cancel(NOTE);
    }
}
