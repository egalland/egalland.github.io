package fr.emmanuel.vibrajiggler

import android.app.Activity
import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.VibrationEffect
import android.os.Vibrator
import android.view.View
import android.view.WindowManager
import android.widget.*
import kotlin.math.roundToInt
import kotlin.random.Random

class MainActivity : Activity() {

    private lateinit var vibrator: Vibrator
    private val handler = Handler(Looper.getMainLooper())

    private lateinit var status: TextView
    private lateinit var startStop: Button
    private lateinit var test: Button
    private lateinit var interval: SeekBar
    private lateinit var intervalLabel: TextView
    private lateinit var duration: SeekBar
    private lateinit var durationLabel: TextView
    private lateinit var intensity: SeekBar
    private lateinit var intensityLabel: TextView
    private lateinit var pattern: Spinner
    private lateinit var randomize: CheckBox
    private lateinit var keepAwake: CheckBox
    private lateinit var blackMode: Button
    private lateinit var scroll: ScrollView

    private var running = false
    private var black = false

    private val tick = object : Runnable {
        override fun run() {
            if (!running) return
            vibrateNow()
            handler.postDelayed(this, nextDelayMs())
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        vibrator = getSystemService(Context.VIBRATOR_SERVICE) as Vibrator

        status = findViewById(R.id.status)
        startStop = findViewById(R.id.startStop)
        test = findViewById(R.id.test)
        interval = findViewById(R.id.interval)
        intervalLabel = findViewById(R.id.intervalLabel)
        duration = findViewById(R.id.duration)
        durationLabel = findViewById(R.id.durationLabel)
        intensity = findViewById(R.id.intensity)
        intensityLabel = findViewById(R.id.intensityLabel)
        pattern = findViewById(R.id.pattern)
        randomize = findViewById(R.id.randomize)
        keepAwake = findViewById(R.id.keepAwake)
        blackMode = findViewById(R.id.blackMode)
        scroll = findViewById(R.id.scroll)

        val patterns = arrayOf(
            "Impulsion simple",
            "Double impulsion",
            "Triple impulsion",
            "Bourdonnement court"
        )
        pattern.adapter = ArrayAdapter(
            this,
            android.R.layout.simple_spinner_dropdown_item,
            patterns
        )

        updateLabels()
        applyKeepAwake()

        interval.setOnSeekBarChangeListener(simpleSeek { updateLabels() })
        duration.setOnSeekBarChangeListener(simpleSeek { updateLabels() })
        intensity.setOnSeekBarChangeListener(simpleSeek { updateLabels() })

        keepAwake.setOnCheckedChangeListener { _, _ -> applyKeepAwake() }

        test.setOnClickListener { vibrateNow() }

        startStop.setOnClickListener {
            if (running) stopJiggler() else startJiggler()
        }

        blackMode.setOnClickListener {
            black = !black
            if (black) {
                scroll.setBackgroundColor(0xFF000000.toInt())
                findViewById<View>(R.id.root).visibility = View.INVISIBLE
                window.decorView.systemUiVisibility =
                    View.SYSTEM_UI_FLAG_FULLSCREEN or
                    View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
            } else {
                findViewById<View>(R.id.root).visibility = View.VISIBLE
                scroll.setBackgroundColor(0xFF101010.toInt())
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
        }

        scroll.setOnClickListener {
            if (black) {
                black = false
                findViewById<View>(R.id.root).visibility = View.VISIBLE
                scroll.setBackgroundColor(0xFF101010.toInt())
                window.decorView.systemUiVisibility = View.SYSTEM_UI_FLAG_VISIBLE
            }
        }
    }

    private fun simpleSeek(onChange: () -> Unit) =
        object : SeekBar.OnSeekBarChangeListener {
            override fun onProgressChanged(seekBar: SeekBar?, progress: Int, fromUser: Boolean) {
                onChange()
            }
            override fun onStartTrackingTouch(seekBar: SeekBar?) {}
            override fun onStopTrackingTouch(seekBar: SeekBar?) {}
        }

    private fun intervalSeconds(): Int = interval.progress + 15
    private fun durationMs(): Long = (duration.progress + 50).toLong()
    private fun amplitude(): Int = intensity.progress + 1

    private fun updateLabels() {
        intervalLabel.text = "Intervalle : ${intervalSeconds()} s"
        durationLabel.text = "Durée : ${durationMs()} ms"
        intensityLabel.text = "Intensité : ${amplitude()} / 255"
    }

    private fun nextDelayMs(): Long {
        val base = intervalSeconds() * 1000.0
        if (!randomize.isChecked) return base.toLong()

        val factor = 0.8 + Random.nextDouble() * 0.4
        return (base * factor).roundToInt().toLong()
    }

    private fun vibrateNow() {
        if (!vibrator.hasVibrator()) {
            Toast.makeText(this, "Aucun vibreur détecté.", Toast.LENGTH_SHORT).show()
            return
        }

        val d = durationMs()
        val a = amplitude()

        val effect = when (pattern.selectedItemPosition) {
            1 -> VibrationEffect.createWaveform(
                longArrayOf(0, d / 2, 90, d / 2),
                intArrayOf(0, a, 0, a),
                -1
            )
            2 -> VibrationEffect.createWaveform(
                longArrayOf(0, d / 3, 75, d / 3, 75, d / 3),
                intArrayOf(0, a, 0, a, 0, a),
                -1
            )
            3 -> VibrationEffect.createWaveform(
                longArrayOf(0, 40, 25, 40, 25, 40, 25, 40),
                intArrayOf(0, a, 0, a, 0, a, 0, a),
                -1
            )
            else -> VibrationEffect.createOneShot(d, a)
        }

        vibrator.vibrate(effect)
    }

    private fun startJiggler() {
        running = true
        status.text = "EN COURS"
        startStop.text = "Arrêter"
        handler.removeCallbacks(tick)

        // Première vibration après 2 secondes pour laisser le temps de poser la souris.
        handler.postDelayed(tick, 2000)
    }

    private fun stopJiggler() {
        running = false
        handler.removeCallbacks(tick)
        vibrator.cancel()
        status.text = "ARRÊTÉ"
        startStop.text = "Démarrer"
    }

    private fun applyKeepAwake() {
        if (keepAwake.isChecked) {
            window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        } else {
            window.clearFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        }
    }

    override fun onDestroy() {
        stopJiggler()
        super.onDestroy()
    }
}
