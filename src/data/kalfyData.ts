import type { CtfMission, RankInfo, RouteInfo } from '../types.ts';

export const OFFICIAL_ROUTES: RouteInfo[] = [
  {
    id: 1,
    title: 'Sistemas Operativos y Redes',
    shortDesc:
      'Terminal Linux, TCP/IP, subredes, permisos, puertos y Proyecto Final de Auditoría de Red.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-1.png',
    accentColor: 'emerald',
    topics: ['Terminal Linux', 'Modelo OSI & TCP/IP', 'Subredes CIDR', 'Permisos POSIX', 'Análisis de Puertos'],
    sampleLessons: [
      'Clase 01: Navegación avanzada, tuberías y redirecciones en Bash',
      'Clase 08: Permisos especiales SUID, SGID y Sticky Bit en Linux',
      'Clase 15: Subnetting IPv4 rápido y cálculo de máscaras CIDR',
      'Clase 21: Inspección de sockets y captura de tráfico con tcpdump'
    ],
    cliCommands: ['ip addr', 'ss -tulnp', 'chmod 4755', 'tcpdump -i eth0', 'nmap -sS'],
    finalProjectTitle: 'Proyecto Final: Auditoría de Red Corporativa',
    finalProjectDesc:
      'Mapea una subred aislada, documenta servicios expuestos, corrige reglas de firewall con iptables y entrega tu informe técnico para revisión del Administrador.'
  },
  {
    id: 2,
    title: 'Python y Criptografía',
    shortDesc:
      'Scripting ofensivo/defensivo, automatización, hashing, AES/RSA y Proyecto Final en Python.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-2.png',
    accentColor: 'amber',
    topics: ['Python para SecOps', 'Automatización CLI', 'Hashing SHA/HMAC', 'Cifrado AES-GCM', 'Firmas RSA'],
    sampleLessons: [
      'Clase 03: Sockets crudos en Python y escáner de puertos multihilo',
      'Clase 10: Integridad criptográfica con SHA-256, PBKDF2 y Argon2',
      'Clase 17: Cifrado simétrico AES-256 y gestión segura de nonces',
      'Clase 22: Intercambio de llaves RSA y validación de certificados X.509'
    ],
    cliCommands: ['python3 scanner.py', 'openssl dgst -sha256', 'pipenv run', 'base64 -d', 'gpg --verify'],
    finalProjectTitle: 'Proyecto Final: Motor de Bóveda Criptográfica en Python',
    finalProjectDesc:
      'Desarrolla una herramienta CLI en Python que cifre archivos sensibles con AES-256-GCM derivado de contraseña y verifique su firma antes de descifrar.'
  },
  {
    id: 3,
    title: 'OSINT e Ingeniería Social',
    shortDesc:
      'Reconocimiento abierto, metadatos, Google Dorks, vectores humanos y Dossier OSINT.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-3.png',
    accentColor: 'cyan',
    topics: ['Google Dorks', 'Extracción EXIF/PDF', 'Huella Digital', 'DNS & WHOIS', 'Vectores Phishing'],
    sampleLessons: [
      'Clase 04: Operadores avanzados de búsqueda y descubrimiento de repositorios',
      'Clase 09: Extracción de metadatos en documentos e imágenes con ExifTool',
      'Clase 14: Enumeración pasiva de subdominios y registros DNS históricos',
      'Clase 20: Análisis de cabeceras SPF, DKIM y DMARC ante suplantación'
    ],
    cliCommands: ['whois target.sec', 'dig ANY +short', 'exiftool doc.pdf', 'theHarvester', 'curl -I'],
    finalProjectTitle: 'Proyecto Final: Dossier OSINT de Superficie Externa',
    finalProjectDesc:
      'Recopila exclusivamente mediante fuentes abiertas la huella digital de un dominio simulado, detecta fugas de metadatos y redacta el plan de mitigación.'
  },
  {
    id: 4,
    title: 'Explotación y Payloads',
    shortDesc:
      'Análisis de CVEs, shells reversas, Metasploit, mitigación y Laboratorio de Explotación.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-4.png',
    accentColor: 'amber',
    topics: ['Lectura de CVEs', 'Shells Reversas', 'Framework Metasploit', 'Buffer Basics', 'Parcheo y Mitigación'],
    sampleLessons: [
      'Clase 02: Anatomía de un CVE y evaluación de severidad CVSS v3.1',
      'Clase 07: Reverse vs Bind Shells con Netcat y socat cifrado',
      'Clase 13: Uso estructurado de módulos auxiliares y exploits en Metasploit',
      'Clase 19: Desbordamiento básico de pila y protecciones ASLR/NX'
    ],
    cliCommands: ['searchsploit vsftpd', 'nc -lvnp 4444', 'msfconsole -q', 'msfvenom -l', 'checksec --file'],
    finalProjectTitle: 'Proyecto Final: Laboratorio de Explotación y Remediación',
    finalProjectDesc:
      'Valida dos vulnerabilidades críticas en un entorno controlado, documenta la prueba de concepto reproducible y aplica el parche definitivo en el servidor.'
  },
  {
    id: 5,
    title: 'Hacking Web y APIs',
    shortDesc:
      'OWASP Top 10, SQLi, XSS, JWT, IDOR, seguridad en APIs REST y Auditoría Web.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-5.png',
    accentColor: 'emerald',
    topics: ['OWASP Top 10', 'Inyección SQL', 'XSS & CSRF', 'Ataques a JWT', 'IDOR en APIs REST'],
    sampleLessons: [
      'Clase 05: Inyección SQL basada en errores, UNION y consultas parametrizadas',
      'Clase 11: Cross-Site Scripting (XSS) reflejado, almacenado y CSP estricta',
      'Clase 16: Auditoría de tokens JWT, algoritmo none y validación de firma',
      'Clase 23: Control de acceso roto (BOLA/IDOR) en endpoints REST y GraphQL'
    ],
    cliCommands: ['curl -X POST', 'sqlmap -u', 'ffuf -w wordlist', 'jwt_tool', 'nikto -h'],
    finalProjectTitle: 'Proyecto Final: Auditoría Integral de API REST',
    finalProjectDesc:
      'Inspecciona una API con autenticación JWT, identifica fallos de autorización IDOR e inyección SQL, y entrega el parche en código seguro para aprobación.'
  },
  {
    id: 6,
    title: 'Escalada y Active Directory',
    shortDesc:
      'PrivEsc en Linux/Windows, Kerberoasting, movimiento lateral y Hardening AD.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-6.png',
    accentColor: 'emerald',
    topics: ['Linux PrivEsc', 'Windows Tokens', 'Enumeración BloodHound', 'Kerberoasting', 'Hardening GPO'],
    sampleLessons: [
      'Clase 04: Abuso de binarios sudo mal configurados y cronjobs en Linux',
      'Clase 10: Privilegios SeImpersonatePrivilege y servicios sin comillas en Windows',
      'Clase 16: Funcionamiento de Kerberos, tickets TGT/TGS y Kerberoasting',
      'Clase 22: Movimiento lateral controlado y endurecimiento de Active Directory'
    ],
    cliCommands: ['sudo -l', 'find / -perm -4000', 'whoami /priv', 'impacket-GetUserSPNs', 'bloodhound-python'],
    finalProjectTitle: 'Proyecto Final: Hardening de Dominio Active Directory',
    finalProjectDesc:
      'Traza rutas de escalada entre nodos de dominio, identifica cuentas de servicio vulnerables y aplica políticas de mínimo privilegio y Tiering.'
  },
  {
    id: 7,
    title: 'Auditoría WiFi y Android Cloud',
    shortDesc:
      'Seguridad WPA2/WPA3, análisis móvil Android, IAM Cloud y Auditoría Inalámbrica.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-7.png',
    accentColor: 'cyan',
    topics: ['WPA2/WPA3 Handshake', 'Decompilación APK', 'ADB & Permissions', 'Políticas IAM Cloud', 'Buckets S3/Storage'],
    sampleLessons: [
      'Clase 03: Captura ética de 4-way handshake WPA2 y defensa contra PMKID',
      'Clase 09: Ingeniería inversa básica de APKs con jadx y revisión de Manifest',
      'Clase 15: Almacenamiento inseguro en Android y bypass de SSL Pinning en lab',
      'Clase 21: Auditoría de roles IAM excesivos y almacenamiento público en la nube'
    ],
    cliCommands: ['airmon-ng start', 'adb devices', 'apktool d app.apk', 'jadx-gui', 'aws iam list-roles'],
    finalProjectTitle: 'Proyecto Final: Auditoría Inalámbrica y Móvil Android',
    finalProjectDesc:
      'Analiza un APK de prueba en busca de secretos embebidos y evalúa la configuración de red inalámbrica y permisos IAM en la nube.'
  },
  {
    id: 8,
    title: 'Evasión, Blue Team y Forense',
    shortDesc:
      'SIEM, respuesta a incidentes, análisis de memoria/logs, reglas YARA y Proyecto de Graduación.',
    classesCount: 24,
    spriteUrl: '/assets/sprites/routes/ruta-8.png',
    accentColor: 'cyan',
    topics: ['Correlación SIEM', 'Respuesta a Incidentes', 'Forense de Memoria', 'Reglas YARA', 'Threat Hunting'],
    sampleLessons: [
      'Clase 06: Correlación de logs de autenticación y detección de fuerza bruta en SIEM',
      'Clase 12: Adquisición forense preservando cadena de custodia y hashes',
      'Clase 18: Análisis de procesos ocultos en volcado de RAM con Volatility',
      'Clase 23: Redacción de reglas YARA y Sigma para detección temprana'
    ],
    cliCommands: ['journalctl -xe', 'yara -r rules.yar', 'vol3 -f mem.raw', 'grep -E "Failed"', 'sha256sum evidence.img'],
    finalProjectTitle: 'Proyecto de Graduación: Investigación Forense Completa',
    finalProjectDesc:
      'Reconstruye la línea temporal de una intrusión simulada a partir de logs, captura de red y regla YARA personalizada para obtener la certificación final.'
  }
];

export const CTF_MISSIONS: CtfMission[] = [
  {
    id: 'ctf-01',
    routeId: 1,
    routeLabel: 'Ruta 1 · Redes',
    title: 'Puertos Fantasma',
    difficulty: 'Iniciación',
    xpReward: 250,
    vector: 'TCP/IP & Banner Grabbing',
    flagHint: 'KALFY{p0rt_...}',
    objective: 'Identifica el servicio oculto en un puerto efímero no estándar y recupera el banner de bienvenida.'
  },
  {
    id: 'ctf-02',
    routeId: 1,
    routeLabel: 'Ruta 1 · Redes',
    title: 'Túnel PCAP',
    difficulty: 'Iniciación',
    xpReward: 300,
    vector: 'Análisis de Paquetes',
    flagHint: 'KALFY{pc4p_...}',
    objective: 'Reconstruye el flujo TCP en texto claro dentro de una captura de red corporativa.'
  },
  {
    id: 'ctf-03',
    routeId: 2,
    routeLabel: 'Ruta 2 · Python',
    title: 'Oráculo XOR',
    difficulty: 'Iniciación',
    xpReward: 320,
    vector: 'Criptoanálisis en Python',
    flagHint: 'KALFY{x0r_...}',
    objective: 'Escribe un script en Python para recuperar la clave de 4 bytes de un mensaje interceptado.'
  },
  {
    id: 'ctf-04',
    routeId: 2,
    routeLabel: 'Ruta 2 · Python',
    title: 'Firma Rota',
    difficulty: 'Intermedio',
    xpReward: 420,
    vector: 'RSA Exponente Bajo',
    flagHint: 'KALFY{rs4_...}',
    objective: 'Explota un exponente público pequeño sin padding para descifrar la credencial.'
  },
  {
    id: 'ctf-05',
    routeId: 3,
    routeLabel: 'Ruta 3 · OSINT',
    title: 'Metadato Perdido',
    difficulty: 'Iniciación',
    xpReward: 280,
    vector: 'EXIF & Geoposición',
    flagHint: 'KALFY{ex1f_...}',
    objective: 'Extrae el autor oculto y coordenadas del archivo PDF filtrado en un portal público.'
  },
  {
    id: 'ctf-06',
    routeId: 3,
    routeLabel: 'Ruta 3 · OSINT',
    title: 'Subdominio Olvidado',
    difficulty: 'Intermedio',
    xpReward: 380,
    vector: 'DNS TXT & Dorks',
    flagHint: 'KALFY{dn5_...}',
    objective: 'Localiza el registro TXT de verificación olvidado en el entorno de staging.'
  },
  {
    id: 'ctf-07',
    routeId: 4,
    routeLabel: 'Ruta 4 · Explotación',
    title: 'Servicio Heredado',
    difficulty: 'Intermedio',
    xpReward: 480,
    vector: 'CVE & Shell Reversa',
    flagHint: 'KALFY{cv3_...}',
    objective: 'Identifica la versión vulnerable del demonio FTP y obtén acceso de lectura en /root.'
  },
  {
    id: 'ctf-08',
    routeId: 4,
    routeLabel: 'Ruta 4 · Explotación',
    title: 'Desbordamiento Limpio',
    difficulty: 'Avanzado',
    xpReward: 600,
    vector: 'Stack Overflow Básico',
    flagHint: 'KALFY{st4ck_...}',
    objective: 'Redirige el flujo de ejecución a la función secreta win() calculando el offset exacto.'
  },
  {
    id: 'ctf-09',
    routeId: 5,
    routeLabel: 'Ruta 5 · Web & APIs',
    title: 'Token Manipulado',
    difficulty: 'Intermedio',
    xpReward: 450,
    vector: 'JWT Weak Secret',
    flagHint: 'KALFY{jwt_...}',
    objective: 'Audita el token de sesión del panel web y escala el rol a supervisor en el endpoint.'
  },
  {
    id: 'ctf-10',
    routeId: 5,
    routeLabel: 'Ruta 5 · Web & APIs',
    title: 'Inyección Silenciosa',
    difficulty: 'Intermedio',
    xpReward: 500,
    vector: 'Blind SQLi',
    flagHint: 'KALFY{sql1_...}',
    objective: 'Extrae la tabla de banderas mediante inyección booleana automatizada.'
  },
  {
    id: 'ctf-11',
    routeId: 6,
    routeLabel: 'Ruta 6 · Escalada AD',
    title: 'Sudo Peligroso',
    difficulty: 'Avanzado',
    xpReward: 620,
    vector: 'GTFOBins & SUID',
    flagHint: 'KALFY{pr1v_...}',
    objective: 'Escala de usuario estándar a root aprovechando un permiso sudo mal restringido.'
  },
  {
    id: 'ctf-12',
    routeId: 6,
    routeLabel: 'Ruta 6 · Escalada AD',
    title: 'Ticket Dorado',
    difficulty: 'Avanzado',
    xpReward: 700,
    vector: 'Kerberoasting SPN',
    flagHint: 'KALFY{k3rb_...}',
    objective: 'Solicita el ticket TGS de la cuenta de servicio y descifra el hash en laboratorio.'
  },
  {
    id: 'ctf-13',
    routeId: 7,
    routeLabel: 'Ruta 7 · WiFi & Android',
    title: 'APK Secreto',
    difficulty: 'Avanzado',
    xpReward: 640,
    vector: 'Decompilación DEX',
    flagHint: 'KALFY{apk_...}',
    objective: 'Inspecciona los recursos XML y clases Java de un binario Android para hallar la API key.'
  },
  {
    id: 'ctf-14',
    routeId: 7,
    routeLabel: 'Ruta 7 · WiFi & Android',
    title: 'Bucket Expuesto',
    difficulty: 'Intermedio',
    xpReward: 520,
    vector: 'IAM Cloud Misconfig',
    flagHint: 'KALFY{cl0ud_...}',
    objective: 'Enumera la política de acceso de almacenamiento en la nube y recupera el respaldo cifrado.'
  },
  {
    id: 'ctf-15',
    routeId: 8,
    routeLabel: 'Ruta 8 · Forense',
    title: 'Huella en RAM',
    difficulty: 'Élite',
    xpReward: 820,
    vector: 'Volatility Memory Dump',
    flagHint: 'KALFY{m3m_...}',
    objective: 'Extrae las variables de entorno del proceso malicioso persistente en memoria.'
  },
  {
    id: 'ctf-16',
    routeId: 8,
    routeLabel: 'Ruta 8 · Forense',
    title: 'Regla Centinela',
    difficulty: 'Élite',
    xpReward: 950,
    vector: 'YARA & Incident Response',
    flagHint: 'KALFY{y4r4_...}',
    objective: 'Aísla el artefacto correcto entre 200 binarios usando una firma YARA exacta.'
  }
];

export const OFFICIAL_RANKS: RankInfo[] = [
  {
    tier: 1,
    name: 'NOVATO',
    xpRequired: '0 XP',
    xpNumeric: 0,
    spriteUrl: '/assets/sprites/ranks/rank-1.png',
    specialty: 'Primer contacto con terminal Linux',
    clearance: 'Nivel 01 · Acceso Inicial'
  },
  {
    tier: 2,
    name: 'SCRIPT KIDDIE',
    xpRequired: '600 XP',
    xpNumeric: 600,
    spriteUrl: '/assets/sprites/ranks/rank-2.png',
    specialty: 'Ejecución de utilidades base y redes',
    clearance: 'Nivel 02 · Operador Base'
  },
  {
    tier: 3,
    name: 'APRENDIZ',
    xpRequired: '1,800 XP',
    xpNumeric: 1800,
    spriteUrl: '/assets/sprites/ranks/rank-3.png',
    specialty: 'Dominio de CLI y scripting inicial',
    clearance: 'Nivel 03 · Explorador'
  },
  {
    tier: 4,
    name: 'INICIADO',
    xpRequired: '3,500 XP',
    xpNumeric: 3500,
    spriteUrl: '/assets/sprites/ranks/rank-4.png',
    specialty: 'Reconocimiento activo y criptografía',
    clearance: 'Nivel 04 · Reconocimiento'
  },
  {
    tier: 5,
    name: 'TÉCNICO',
    xpRequired: '6,000 XP',
    xpNumeric: 6000,
    spriteUrl: '/assets/sprites/ranks/rank-5.png',
    specialty: 'Configuración de firewalls y hardening',
    clearance: 'Nivel 05 · Infraestructura'
  },
  {
    tier: 6,
    name: 'ANALISTA',
    xpRequired: '9,500 XP',
    xpNumeric: 9500,
    spriteUrl: '/assets/sprites/ranks/rank-6.png',
    specialty: 'Correlación de logs y análisis OSINT',
    clearance: 'Nivel 06 · Inteligencia'
  },
  {
    tier: 7,
    name: 'PENTESTER',
    xpRequired: '14,000 XP',
    xpNumeric: 14000,
    spriteUrl: '/assets/sprites/ranks/rank-7.png',
    specialty: 'Explotación web, APIs y payloads',
    clearance: 'Nivel 07 · Ofensiva Ética'
  },
  {
    tier: 8,
    name: 'AUDITOR',
    xpRequired: '19,500 XP',
    xpNumeric: 19500,
    spriteUrl: '/assets/sprites/ranks/rank-8.png',
    specialty: 'Evaluación integral y reporte ejecutivo',
    clearance: 'Nivel 08 · Cumplimiento'
  },
  {
    tier: 9,
    name: 'VETERANO',
    xpRequired: '26,000 XP',
    xpNumeric: 26000,
    spriteUrl: '/assets/sprites/ranks/rank-9.png',
    specialty: 'Escalada en Active Directory y redes',
    clearance: 'Nivel 09 · Mando Táctico'
  },
  {
    tier: 10,
    name: 'EXPERTO',
    xpRequired: '33,500 XP',
    xpNumeric: 33500,
    spriteUrl: '/assets/sprites/ranks/rank-10.png',
    specialty: 'Auditoría móvil Android, WiFi y Cloud',
    clearance: 'Nivel 10 · Especialista'
  },
  {
    tier: 11,
    name: 'HACKER',
    xpRequired: '42,000 XP',
    xpNumeric: 42000,
    spriteUrl: '/assets/sprites/ranks/rank-11.png',
    specialty: 'Resolución avanzada de CTF de élite',
    clearance: 'Nivel 11 · Operaciones'
  },
  {
    tier: 12,
    name: 'LEYENDA',
    xpRequired: '52,000+ XP',
    xpNumeric: 52000,
    spriteUrl: '/assets/sprites/ranks/rank-12.png',
    specialty: 'Graduado de las 8 Rutas y 16 CTF',
    clearance: 'Nivel 12 · Maestría Total'
  }
];
