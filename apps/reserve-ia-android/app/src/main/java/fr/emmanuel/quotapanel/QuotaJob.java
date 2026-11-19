package fr.emmanuel.quotapanel;
import android.app.job.*;
import java.util.concurrent.*;
public class QuotaJob extends JobService {
    private ExecutorService executor;
    @Override public boolean onStartJob(JobParameters params) {
        executor=Executors.newSingleThreadExecutor();
        executor.submit(()->{Panel.refresh(this);jobFinished(params,false);});
        executor.shutdown(); return true;
    }
    @Override public boolean onStopJob(JobParameters params) {
        if(executor!=null) executor.shutdownNow();
        return Panel.prefs(this).getBoolean("enabled",false);
    }
}
