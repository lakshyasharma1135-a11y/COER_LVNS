import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { GateScan, Profile } from '@/lib/supabase';
import {
  ScanFace, Loader2, QrCode, Camera, Car, CheckCircle2, XCircle,
  Clock, Shield, Smartphone, Fingerprint,
} from 'lucide-react';

export default function GateScan() {
  const { profile } = useAuth();
  const [scans, setScans] = useState<GateScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<'granted' | 'denied' | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [scanMethod, setScanMethod] = useState<'mobile' | 'camera'>('mobile');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    if (profile) {
      const { data } = await supabase.from('gate_scans').select('*').eq('student_id', profile.id).order('scan_time', { ascending: false });
      setScans(data || []);
    }
    setLoading(false);
  }

  async function doScan() {
    if (!profile || scanning) return;
    setScanning(true);
    setScanResult(null);
    setTimeout(async () => {
      const granted = Math.random() > 0.05;
      setScanResult(granted ? 'granted' : 'denied');
      const { data } = await supabase.from('gate_scans').insert({
        student_id: profile.id,
        vehicle_number: vehicleNumber || null,
        status: granted ? 'granted' : 'denied',
        scan_method: scanMethod,
      }).select().single();
      if (data) {
        setScans((prev) => [data, ...prev]);
      }
      setScanning(false);
    }, 2000);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center shadow-lg shadow-violet-500/20">
          <ScanFace className="w-8 h-8 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Smart ID / Gate Scan</h1>
          <p className="text-slate-500">Mobile ID, gate entry, and vehicle scanning</p>
        </div>
      </div>

      {/* Digital ID Card */}
      <div className="card overflow-hidden">
        <div className="bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              <span className="font-semibold text-sm">Digital Student ID</span>
            </div>
            <span className="text-xs bg-white/20 px-3 py-1 rounded-full">2026-2027</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold backdrop-blur">
              {profile?.full_name?.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile?.full_name}</h2>
              <p className="text-violet-100 text-sm">{profile?.student_id || 'No ID'}</p>
              <p className="text-violet-200 text-xs mt-1">{profile?.department || 'Department'}</p>
              {profile?.semester && <p className="text-violet-200 text-xs">Semester {profile.semester}</p>}
            </div>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Fingerprint className="w-4 h-4 text-violet-600" />
            <span>Scan to verify identity</span>
          </div>
          {/* Mini QR */}
          <div className="grid grid-cols-6 gap-px">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className={`w-2 h-2 ${Math.random() > 0.4 ? 'bg-slate-900' : 'bg-transparent'}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Gate Scanner */}
      <div className="card p-6">
        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
          <ScanFace className="w-5 h-5 text-violet-600" /> Gate Entry Scanner
        </h3>

        {/* Method toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setScanMethod('mobile')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${scanMethod === 'mobile' ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-500'}`}
          >
            <Smartphone className="w-4 h-4" /> Mobile Scan
          </button>
          <button
            onClick={() => setScanMethod('camera')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border-2 transition-all ${scanMethod === 'camera' ? 'border-violet-500 bg-violet-50 text-violet-600' : 'border-slate-200 text-slate-500'}`}
          >
            <Camera className="w-4 h-4" /> Camera Scan
          </button>
        </div>

        {/* Vehicle input */}
        <div className="mb-4">
          <label className="text-sm font-semibold text-slate-700 mb-1.5 block flex items-center gap-1.5">
            <Car className="w-4 h-4" /> Vehicle Number (optional)
          </label>
          <input
            type="text"
            value={vehicleNumber}
            onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
            placeholder="e.g. MH12 AB 1234"
            className="input-field uppercase font-mono"
          />
        </div>

        {/* Scan button */}
        <button
          onClick={doScan}
          disabled={scanning}
          className="btn-primary w-full flex items-center justify-center gap-2"
        >
          {scanning ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Scanning...</>
          ) : (
            <><QrCode className="w-5 h-5" /> Scan at Gate</>
          )}
        </button>

        {/* Scan result */}
        {scanResult && (
          <div className={`mt-4 p-6 rounded-xl text-center animate-scale-in ${scanResult === 'granted' ? 'bg-green-50' : 'bg-red-50'}`}>
            {scanResult === 'granted' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-green-700">Access Granted</h3>
                <p className="text-green-600 text-sm mt-1">Identity verified. You may enter the campus.</p>
              </>
            ) : (
              <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-2" />
                <h3 className="text-xl font-bold text-red-600">Access Denied</h3>
                <p className="text-red-500 text-sm mt-1">Please contact the security office.</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Scan history */}
      <div>
        <h3 className="font-bold text-slate-900 mb-3">Scan History</h3>
        {loading ? (
          <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-blue-600 animate-spin" /></div>
        ) : scans.length === 0 ? (
          <div className="card p-8 text-center">
            <ScanFace className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">No scans yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scans.map((s) => (
              <div key={s.id} className="card p-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.status === 'granted' ? 'bg-green-50' : 'bg-red-50'}`}>
                  {s.status === 'granted' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-slate-900 capitalize">{s.status}</p>
                  <p className="text-xs text-slate-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> {new Date(s.scan_time).toLocaleString()}
                    {s.vehicle_number && <span className="flex items-center gap-1"><Car className="w-3 h-3" /> {s.vehicle_number}</span>}
                  </p>
                </div>
                <span className="badge badge-neutral capitalize">{s.scan_method}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
