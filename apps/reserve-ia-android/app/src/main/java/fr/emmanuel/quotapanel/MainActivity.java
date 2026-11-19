package fr.emmanuel.quotapanel;
import android.app.*;
import android.os.*;
import android.content.*;
import android.graphics.Color;
import android.view.*;
import android.widget.*;
import android.text.InputType;
import android.content.pm.PackageManager;

public class MainActivity extends Activity {
    private EditText url,token; private TextView status; private Button start,refresh;
    private final java.util.concurrent.ExecutorService executor=java.util.concurrent.Executors.newSingleThreadExecutor();
    private boolean busy=false;
    @Override public void onCreate(Bundle saved) {
        super.onCreate(saved);
        ScrollView scroll=new ScrollView(this); LinearLayout box=new LinearLayout(this); box.setOrientation(1);box.setPadding(32,48,32,48);scroll.addView(box);setContentView(scroll);
        TextView title=new TextView(this);title.setText("Réserve IA");title.setTextSize(30);box.addView(title);
        TextView desc=new TextView(this);desc.setText("Votre réserve Work / Codex dans les notifications.\nRelais personnel requis. Aucune valeur de démonstration.\n\n");box.addView(desc);
        TextView urlLabel=new TextView(this);urlLabel.setText("Adresse HTTPS du relais (terminant par /quota)");box.addView(urlLabel);
        url=new EditText(this);url.setSingleLine(true);url.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_URI);url.setText(Panel.prefs(this).getString("url",""));box.addView(url);
        TextView keyLabel=new TextView(this);keyLabel.setText("Clé du relais — ce n’est pas votre mot de passe OpenAI");box.addView(keyLabel);
        token=new EditText(this);token.setSingleLine(true);token.setInputType(InputType.TYPE_CLASS_TEXT|InputType.TYPE_TEXT_VARIATION_PASSWORD);token.setHint("Laisser vide pour conserver la clé enregistrée");box.addView(token);
        start=new Button(this);start.setText("Enregistrer et activer le suivi");box.addView(start);
        start.setOnClickListener(v->activate());
        refresh=new Button(this);refresh.setText("Actualiser maintenant");box.addView(refresh);refresh.setOnClickListener(v->update());
        Button stop=new Button(this);stop.setText("Arrêter et retirer la notification");box.addView(stop);stop.setOnClickListener(v->{Panel.stop(this);status.setText("Suivi arrêté");});
        Button settings=new Button(this);settings.setText("Réglages des notifications");box.addView(settings);settings.setOnClickListener(v->startActivity(new Intent(android.provider.Settings.ACTION_APP_NOTIFICATION_SETTINGS).putExtra(android.provider.Settings.EXTRA_APP_PACKAGE,getPackageName())));
        status=new TextView(this);status.setTextSize(16);status.setPadding(0,24,0,24);status.setText(Panel.prefs(this).getString("status","Aucune donnée. Configurez le relais pour commencer."));box.addView(status);
        TextView help=new TextView(this);help.setText("\nActualisation périodique demandée toutes les 15 minutes ; Android et HyperOS peuvent la retarder. La date de mesure reste affichée.\n\nSur Poco : si nécessaire, autoriser l’activité en arrière-plan et les notifications dans les réglages de l’application. Android peut permettre de balayer la notification ; rouvrir l’application puis Actualiser pour la réafficher.\n\nUne clé API OpenAI ne donne pas les quotas de votre abonnement ChatGPT.");box.addView(help);
        if(getIntent().getBooleanExtra("refresh",false)) update();
    }
    private void activate() {
        try {
            java.net.URI uri=java.net.URI.create(url.getText().toString().trim());
            if(!"https".equals(uri.getScheme())||uri.getHost()==null||uri.getUserInfo()!=null||!"/quota".equals(uri.getPath())||uri.getQuery()!=null||uri.getFragment()!=null) throw new Exception();
            String key=token.getText().toString();
            if(key.isEmpty()) key=SecretStore.get(this);
            if(key.length()<32) {status.setText("La clé du relais doit contenir au moins 32 caractères.");return;}
            SecretStore.put(this,key); token.setText("");
            Panel.prefs(this).edit().putString("url",uri.toString()).commit();
            if(Build.VERSION.SDK_INT>=33&&checkSelfPermission("android.permission.POST_NOTIFICATIONS")!=PackageManager.PERMISSION_GRANTED) {
                requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"},7);return;
            }
            enable();
        } catch(Exception e) {status.setText("Vérifier l’adresse HTTPS /quota et saisir une clé de relais valide.");}
    }
    private void enable() {
        if(!getSystemService(NotificationManager.class).areNotificationsEnabled()) {status.setText("Autoriser les notifications dans les réglages, puis réactiver le suivi.");return;}
        try {Panel.schedule(this);Panel.prefs(this).edit().putBoolean("enabled",true).apply();update();}
        catch(Exception e) {status.setText("Android a refusé la planification du suivi.");}
    }
    @Override public void onRequestPermissionsResult(int code,String[] permissions,int[] grants) {
        super.onRequestPermissionsResult(code,permissions,grants);
        if(code==7&&grants.length>0&&grants[0]==PackageManager.PERMISSION_GRANTED) enable();
        else status.setText("Permission de notification refusée. Le suivi n’a pas été activé.");
    }
    private void update() {
        if(busy)return;
        busy=true;start.setEnabled(false);refresh.setEnabled(false);status.setText("Lecture en cours…");
        executor.submit(()->{String text=Panel.refresh(getApplicationContext());runOnUiThread(()->{
            busy=false;if(isDestroyed())return;start.setEnabled(true);refresh.setEnabled(true);
            status.setText(Panel.prefs(this).getBoolean("enabled",false)?text:"Suivi arrêté");
        });});
    }
    @Override protected void onDestroy(){executor.shutdown();super.onDestroy();}
}
