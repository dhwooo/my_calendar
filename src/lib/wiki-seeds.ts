import { prisma } from "@/lib/db";

type SeedPage = {
  title: string;
  icon?: string;
  content: string;
  children?: SeedPage[];
};

const LINUX_MASTER_PLAN: SeedPage = {
  title: "리눅스마스터 2급 2차 합격 플랜",
  icon: "🐧",
  content: `# 리눅스마스터 2급 2차 (실기) 합격 플랜

> 4주(28일) 집중 학습 + 1주 모의고사 = **총 35일** 로드맵

## 시험 개요

| 항목 | 내용 |
| --- | --- |
| 시험명 | 리눅스마스터 2급 2차 (실기) |
| 합격 기준 | **60점 이상** (100점 만점) |
| 문항 수 | 단답형 / 작업형 약 20~30문항 |
| 시험 시간 | 100분 |
| 응시료 | 25,000원 |
| 합격률 | 약 50~60% |

## 출제 영역 (비율)

- **리눅스 일반 (20%)** — 부팅, 종료, 사용자 환경
- **시스템 관리 (35%)** — 파일시스템, 권한, 프로세스, 패키지, cron
- **네트워크 관리 (25%)** — IP, 라우팅, 방화벽, SSH
- **시스템 보안 및 운영 (20%)** — 로그, 백업, 보안 설정

## 4주 학습 일정 한눈에

| 주차 | 주제 | 시간 |
| --- | --- | --- |
| 1주차 | 기본 명령어 + 파일/권한 | 평일 1시간, 주말 3시간 |
| 2주차 | 사용자/프로세스/패키지 관리 | 동일 |
| 3주차 | 네트워크 + 셸 스크립트 | 동일 |
| 4주차 | 모의고사 + 약점 보강 | 평일 1.5시간, 주말 4시간 |

## 추천 자료

- 시나공 리눅스마스터 2급 (필기 + 실기 포함)
- 영진닷컴 기출문제집 최신년도
- VirtualBox + Rocky/Ubuntu 실습 환경
- 유튜브: "리눅스마스터 2차" 검색 (kocw, 정보처리기능사 등 채널)

## 합격 팁

1. **반드시 직접 타이핑** — 눈으로만 보면 안 외워짐
2. **옵션은 자주 쓰는 5개만 외움** — 나머지는 \`man\` 페이지로
3. **실기는 답안 작성 형식 주의** — 명령어 + 옵션 + 인자 띄어쓰기
4. **단답형 단어 정확히** — 한국어 표기까지 시험에 그대로 나옴

---

각 주차 학습 내용은 하위 페이지를 참고하세요. 화이팅 🔥`,
  children: [
    {
      title: "1주차 · 기본 명령어와 파일 관리",
      icon: "📁",
      content: `# 1주차 · 기본 명령어와 파일 관리

## 학습 목표

- 디렉토리 구조 이해
- 파일 조작 명령어 능숙
- 권한 체계 완벽 이해

## Day 1-2 · 디렉토리 구조

\`\`\`
/         루트
├─ /bin   필수 명령어
├─ /etc   시스템 설정
├─ /home  사용자 홈
├─ /var   로그, 메일, 캐시
├─ /tmp   임시 파일
├─ /usr   추가 응용 프로그램
└─ /proc  커널 정보 (가상)
\`\`\`

### 외워야 할 명령어

\`\`\`bash
pwd              # 현재 위치
cd /etc          # 이동
ls -al           # 숨김 파일 + 상세
mkdir -p a/b/c   # 중간 디렉토리 자동 생성
rmdir            # 빈 디렉토리만
rm -rf           # 강제 + 재귀
\`\`\`

## Day 3-4 · 파일 조작

\`\`\`bash
cp -r src dst              # 디렉토리 복사
mv old new                 # 이동/이름 변경
ln -s target link          # 심볼릭 링크
ln target link             # 하드 링크
find / -name "*.conf"      # 검색
find /var/log -mtime -7    # 7일 내 수정
locate                     # 인덱스 기반 검색 (updatedb)
\`\`\`

### 파일 내용 보기

\`\`\`bash
cat file              # 전체 출력
head -n 20 file       # 상위 20줄
tail -f /var/log/messages  # 실시간
less file             # 페이지 단위 (q로 종료)
grep "error" file     # 검색
grep -r "TODO" .      # 재귀
\`\`\`

## Day 5-6 · 권한 관리 (필수!)

### 권한 표기 이해

\`\`\`
-rwxr-xr--  1 user group  file
│└┬┘└┬┘└┬┘
│ │  │  └ 기타 사용자 (r--)
│ │  └─── 그룹 (r-x)
│ └────── 소유자 (rwx)
└──────── 파일 종류 (- 파일, d 디렉토리, l 링크)
\`\`\`

### 권한 부여

\`\`\`bash
chmod 755 file       # rwxr-xr-x
chmod u+x file       # 소유자에게 실행 권한
chmod -R 644 dir     # 재귀
chown user:group file
chgrp group file
\`\`\`

### 특수 권한

| 권한 | 숫자 | 의미 |
| --- | --- | --- |
| SetUID | 4000 | 실행 시 소유자 권한 |
| SetGID | 2000 | 실행 시 그룹 권한 |
| Sticky | 1000 | 소유자만 삭제 가능 (/tmp) |

\`\`\`bash
chmod 4755 file   # SetUID
chmod 1777 /tmp   # Sticky
\`\`\`

## Day 7 · 주간 복습 + 기출 풀이

- 1주차 명령어 50개 직접 입력
- 권한 8진수 ↔ 문자 변환 30문제

---

✅ **체크리스트**

- [ ] 디렉토리 구조 그림으로 그리기
- [ ] \`ls -al\` 출력 해석 가능
- [ ] \`chmod\` 8진수 즉시 계산
- [ ] 심볼릭/하드 링크 차이 설명`,
    },
    {
      title: "2주차 · 시스템 관리",
      icon: "⚙️",
      content: `# 2주차 · 시스템 관리

## 학습 목표

- 사용자/그룹 관리 완벽
- 프로세스 제어 능숙
- 패키지 관리 (yum/apt) 자유롭게

## Day 8-9 · 사용자/그룹

\`\`\`bash
useradd -m -s /bin/bash dhwoo   # 홈 디렉토리 + 셸
passwd dhwoo                    # 비밀번호 설정
usermod -aG wheel dhwoo         # 그룹 추가
userdel -r dhwoo                # 홈 포함 삭제

groupadd dev
groupmod -n newdev dev
groupdel dev
\`\`\`

### 주요 파일

| 파일 | 내용 |
| --- | --- |
| \`/etc/passwd\` | 사용자 정보 (UID, 홈, 셸) |
| \`/etc/shadow\` | 암호 해시 |
| \`/etc/group\` | 그룹 |
| \`/etc/login.defs\` | 사용자 기본 설정 |
| \`/etc/skel/\` | 신규 사용자 홈 템플릿 |

## Day 10-11 · 프로세스 관리

\`\`\`bash
ps -ef             # 전체 프로세스
ps aux             # BSD 스타일
top                # 실시간 모니터
htop               # 더 예쁜 top
kill -9 1234       # SIGKILL
killall nginx
nohup ./long &     # 백그라운드 + 로그아웃 무관
jobs               # 백그라운드 작업
fg %1              # 포그라운드 복귀
\`\`\`

### 시그널 번호

| 번호 | 이름 | 의미 |
| --- | --- | --- |
| 1 | SIGHUP | 재시작 |
| 2 | SIGINT | Ctrl+C |
| 9 | SIGKILL | 강제 종료 |
| 15 | SIGTERM | 정상 종료 (기본) |
| 18 | SIGCONT | 재개 |
| 19 | SIGSTOP | 일시정지 |

## Day 12 · 패키지 관리

### RHEL/CentOS/Rocky (yum/dnf)

\`\`\`bash
yum install httpd
yum remove httpd
yum update
yum list installed
yum search nginx
yum info nginx
rpm -qa | grep nginx
rpm -ivh package.rpm
\`\`\`

### Debian/Ubuntu (apt)

\`\`\`bash
apt install nginx
apt remove nginx
apt update && apt upgrade
dpkg -l | grep nginx
dpkg -i package.deb
\`\`\`

## Day 13 · cron / at

\`\`\`bash
crontab -e          # 편집
crontab -l          # 목록
crontab -r          # 삭제

# 형식: 분 시 일 월 요일 명령어
0  3 * * *      /usr/local/bin/backup.sh  # 매일 03:00
*/5 * * * *     /usr/bin/check.sh         # 5분마다
0  0 1 * *      /usr/local/bin/monthly.sh # 매월 1일 자정

at 22:00            # 일회성 작업
at now + 5 minutes
atq                 # 큐 확인
atrm 1              # 작업 삭제
\`\`\`

## Day 14 · 주간 복습

- 사용자 추가/삭제/그룹변경 시나리오 10개
- 프로세스 시그널 표 외우기
- cron 형식 20문제

---

✅ **체크리스트**

- [ ] \`/etc/passwd\` 한 줄 해석 가능
- [ ] cron 표기 자유롭게 작성
- [ ] yum/apt 명령 양쪽 다 외우기`,
    },
    {
      title: "3주차 · 네트워크 + 셸 스크립트",
      icon: "🌐",
      content: `# 3주차 · 네트워크 + 셸 스크립트

## 학습 목표

- IP/라우팅/방화벽 설정
- vi 편집기 완벽 (필수 출제)
- 셸 스크립트 기본 작성

## Day 15-16 · 네트워크 설정

### IP 확인/설정

\`\`\`bash
ip addr                    # 인터페이스 정보 (최신)
ip link                    # 링크 상태
ifconfig                   # 구버전
hostname
hostname -I

# 임시 IP 부여
ip addr add 192.168.1.10/24 dev eth0
ip link set eth0 up

# 영구 설정 (RHEL 계열)
vi /etc/sysconfig/network-scripts/ifcfg-eth0
\`\`\`

### 라우팅

\`\`\`bash
ip route                          # 라우팅 테이블
ip route add default via 192.168.1.1
route -n                          # 구버전
netstat -rn
\`\`\`

### DNS

\`\`\`bash
cat /etc/resolv.conf
nslookup google.com
dig google.com
host google.com
\`\`\`

### 연결 확인

\`\`\`bash
ping -c 4 google.com
traceroute google.com
ss -tnlp           # 리스닝 포트 (최신)
netstat -tnlp      # 구버전
telnet host 80
nc -zv host 22     # 포트 체크
\`\`\`

## Day 17 · 방화벽 + SSH

### firewalld (RHEL)

\`\`\`bash
firewall-cmd --state
firewall-cmd --list-all
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
\`\`\`

### iptables

\`\`\`bash
iptables -L -n
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
iptables -A INPUT -j DROP
\`\`\`

### SSH

\`\`\`bash
ssh user@host
ssh -p 2222 user@host
ssh-keygen -t rsa
ssh-copy-id user@host
scp file.txt user@host:/tmp/
rsync -av src/ user@host:dst/
\`\`\`

## Day 18-19 · vi 편집기 (절대 출제!)

### 모드

- **명령 모드** (기본) — 이동, 삭제, 복사
- **입력 모드** — i, a, o로 진입
- **명령행 모드** — \`:\` 입력

### 핵심 명령

\`\`\`
i / a / o      입력 모드 (현재/뒤/아래줄)
ESC            명령 모드 복귀
:w             저장
:q             종료
:wq / ZZ       저장 후 종료
:q!            저장 없이 종료
:set nu        줄 번호
/word          검색 (n: 다음)
:%s/old/new/g  전체 치환
dd             줄 삭제
yy             줄 복사
p              붙여넣기
u              실행 취소
gg / G         맨 위 / 맨 아래
\`\`\`

## Day 20 · 셸 스크립트 기본

### 첫 스크립트

\`\`\`bash
#!/bin/bash
NAME="dhwoo"
echo "Hello, $NAME"
\`\`\`

### 조건문

\`\`\`bash
if [ -f /etc/passwd ]; then
  echo "파일 있음"
elif [ -d /tmp ]; then
  echo "디렉토리 있음"
else
  echo "없음"
fi
\`\`\`

### 반복문

\`\`\`bash
for i in 1 2 3; do
  echo $i
done

for file in *.log; do
  echo $file
done

count=0
while [ $count -lt 5 ]; do
  echo $count
  count=$((count + 1))
done
\`\`\`

### 자주 쓰는 테스트 옵션

| 옵션 | 의미 |
| --- | --- |
| \`-f\` | 일반 파일 |
| \`-d\` | 디렉토리 |
| \`-e\` | 존재 |
| \`-r/-w/-x\` | 읽기/쓰기/실행 가능 |
| \`-z\` | 빈 문자열 |
| \`-eq / -ne / -lt / -gt\` | 숫자 비교 |
| \`= / !=\` | 문자열 비교 |

## Day 21 · 주간 복습

- vi 명령어 30개 무작위 테스트
- 셸 스크립트 5개 직접 작성

---

✅ **체크리스트**

- [ ] \`ip\` 명령으로 인터페이스 설정 가능
- [ ] vi 모드 전환 무리 없음
- [ ] 간단한 백업 스크립트 작성 가능`,
    },
    {
      title: "4주차 · 실전 모의고사 & 약점 보강",
      icon: "🎯",
      content: `# 4주차 · 실전 모의고사 & 약점 보강

## Day 22-23 · 기출문제 1회독

- 최근 3년 기출 풀이
- 틀린 문제 → 별도 메모 페이지에 정리
- 모르는 명령어는 \`man\` 페이지 + 실습

## Day 24 · 시스템 보안

\`\`\`bash
# 로그 확인
tail -f /var/log/messages
tail -f /var/log/secure       # 인증 로그
journalctl -u sshd            # systemd 로그
journalctl -xe                # 최근 + 자세히

# 백업
tar -cvzf backup.tar.gz /home/dhwoo
tar -xvzf backup.tar.gz -C /restore
rsync -av /src /dst

# 압축
gzip / gunzip
bzip2 / bunzip2
xz / unxz
\`\`\`

### 보안 파일

| 파일 | 내용 |
| --- | --- |
| \`/etc/hosts.allow\` | 접근 허용 |
| \`/etc/hosts.deny\` | 접근 차단 |
| \`/etc/securetty\` | root 접근 가능 터미널 |
| \`/etc/sudoers\` | sudo 권한 (visudo로만 편집) |

## Day 25 · 자주 출제되는 작업형

### 시나리오 1 — 사용자 추가 후 sudo 권한

\`\`\`bash
useradd -m dhwoo
passwd dhwoo
usermod -aG wheel dhwoo
# /etc/sudoers 또는 /etc/sudoers.d/dhwoo
echo "dhwoo ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/dhwoo
\`\`\`

### 시나리오 2 — 디스크 공간 확보

\`\`\`bash
df -h
du -sh /var/log/*
find /tmp -type f -mtime +30 -delete
journalctl --vacuum-time=7d
\`\`\`

### 시나리오 3 — 서비스 자동 시작

\`\`\`bash
systemctl start httpd
systemctl enable httpd
systemctl status httpd
systemctl stop httpd
systemctl disable httpd
systemctl restart httpd
\`\`\`

### 시나리오 4 — 포트 80 방화벽 개방

\`\`\`bash
firewall-cmd --permanent --add-service=http
firewall-cmd --reload
\`\`\`

## Day 26-27 · 모의고사 2회독

- 1일 1회 (100분 타이머)
- 점수 60점 미만이면 그 영역 집중 복습
- **시간 안배 연습** — 단답형 2분/문항, 작업형 5분/문항

## Day 28 · 시험 전날

- 새로운 내용 학습 X
- 명령어 손글씨로 한 번 정리
- 충분한 수면

---

## 시험 당일 체크리스트

- [ ] 신분증
- [ ] 수험표
- [ ] 검은색 펜
- [ ] 30분 전 도착
- [ ] 시험 시작 전 화장실
- [ ] 답안지 표기 — 단답형은 정자로

화이팅 💪`,
    },
    {
      title: "자주 출제되는 명령어 치트시트",
      icon: "📋",
      content: `# 명령어 치트시트 (실기 빈출 Top 50)

## 파일/디렉토리

| 명령 | 예시 | 설명 |
| --- | --- | --- |
| \`pwd\` | \`pwd\` | 현재 디렉토리 |
| \`cd\` | \`cd /etc\` | 이동 |
| \`ls\` | \`ls -al\` | 목록 (숨김+상세) |
| \`mkdir\` | \`mkdir -p a/b/c\` | 생성 (중간 자동) |
| \`rmdir\` | \`rmdir empty\` | 빈 디렉토리 삭제 |
| \`rm\` | \`rm -rf dir\` | 강제 재귀 삭제 |
| \`cp\` | \`cp -r src dst\` | 디렉토리 복사 |
| \`mv\` | \`mv old new\` | 이동/이름변경 |
| \`ln\` | \`ln -s target link\` | 심볼릭 링크 |
| \`find\` | \`find / -name "*.conf"\` | 검색 |
| \`locate\` | \`locate passwd\` | 인덱스 검색 |
| \`which\` | \`which python\` | 명령어 위치 |
| \`whereis\` | \`whereis python\` | 바이너리+소스 |
| \`file\` | \`file /bin/ls\` | 파일 종류 |
| \`stat\` | \`stat file\` | 메타데이터 |
| \`touch\` | \`touch new.txt\` | 빈 파일 생성 |
| \`du\` | \`du -sh /var\` | 디렉토리 크기 |
| \`df\` | \`df -h\` | 디스크 사용량 |

## 파일 내용

| 명령 | 예시 | 설명 |
| --- | --- | --- |
| \`cat\` | \`cat /etc/passwd\` | 전체 출력 |
| \`tac\` | \`tac file\` | 역순 |
| \`head\` | \`head -n 5 file\` | 상위 N줄 |
| \`tail\` | \`tail -f log\` | 실시간 |
| \`less\` | \`less file\` | 페이지 단위 |
| \`more\` | \`more file\` | 페이지 (단방향) |
| \`wc\` | \`wc -l file\` | 줄/단어/문자 카운트 |
| \`grep\` | \`grep -r "TODO" .\` | 패턴 검색 |
| \`sed\` | \`sed 's/old/new/g' f\` | 치환 |
| \`awk\` | \`awk '{print $1}' f\` | 필드 추출 |
| \`sort\` | \`sort -n file\` | 정렬 |
| \`uniq\` | \`uniq -c file\` | 중복 제거 |
| \`cut\` | \`cut -d: -f1 /etc/passwd\` | 컬럼 추출 |

## 권한

| 명령 | 예시 | 설명 |
| --- | --- | --- |
| \`chmod\` | \`chmod 755 file\` | 권한 변경 |
| \`chown\` | \`chown user:group f\` | 소유자 변경 |
| \`chgrp\` | \`chgrp group file\` | 그룹 변경 |
| \`umask\` | \`umask 022\` | 기본 권한 |

## 사용자/그룹

| 명령 | 예시 |
| --- | --- |
| \`useradd -m -s /bin/bash u\` | 사용자 추가 |
| \`passwd u\` | 비밀번호 설정 |
| \`usermod -aG g u\` | 그룹 추가 |
| \`userdel -r u\` | 사용자 삭제 |
| \`groupadd g\` | 그룹 추가 |
| \`id u\` | UID/GID 확인 |
| \`whoami\` | 현재 사용자 |
| \`who\` | 접속자 |
| \`w\` | 접속자 + 활동 |

## 프로세스

| 명령 | 예시 |
| --- | --- |
| \`ps -ef\` | 전체 프로세스 |
| \`top\` / \`htop\` | 실시간 모니터 |
| \`kill -9 PID\` | 강제 종료 |
| \`killall name\` | 이름으로 종료 |
| \`nohup cmd &\` | 백그라운드 + 로그아웃 무관 |
| \`jobs\` | 백그라운드 작업 |
| \`bg\` / \`fg\` | 백/포그라운드 전환 |

## 네트워크

| 명령 | 예시 |
| --- | --- |
| \`ip addr\` | 인터페이스 |
| \`ip route\` | 라우팅 |
| \`ping host\` | 연결 확인 |
| \`netstat -tnlp\` | 포트 |
| \`ss -tnlp\` | 포트 (최신) |
| \`nslookup\` / \`dig\` | DNS |
| \`traceroute\` | 경로 추적 |

## 시스템

| 명령 | 예시 |
| --- | --- |
| \`uname -a\` | 시스템 정보 |
| \`uptime\` | 가동 시간 |
| \`date\` | 날짜/시간 |
| \`cal\` | 달력 |
| \`free -h\` | 메모리 |
| \`hostname\` | 호스트명 |
| \`shutdown -h now\` | 즉시 종료 |
| \`reboot\` | 재부팅 |
| \`history\` | 명령어 이력 |

## 아카이브/압축

| 명령 | 예시 |
| --- | --- |
| \`tar -cvzf f.tar.gz dir\` | 압축 (gz) |
| \`tar -xvzf f.tar.gz\` | 해제 |
| \`tar -tvf f.tar\` | 목록 |
| \`gzip f\` / \`gunzip f.gz\` | gzip |
| \`bzip2 f\` / \`bunzip2 f.bz2\` | bzip2 |
| \`zip -r a.zip dir\` / \`unzip a.zip\` | zip |

## 패키지

| 명령 | 예시 |
| --- | --- |
| \`yum install pkg\` | 설치 (RHEL) |
| \`apt install pkg\` | 설치 (Debian) |
| \`rpm -ivh f.rpm\` | rpm 설치 |
| \`dpkg -i f.deb\` | deb 설치 |
| \`yum list installed\` / \`rpm -qa\` | 설치 목록 |`,
    },
  ],
};

export async function seedLinuxMaster(userId: string) {
  const existing = await prisma.wikiPage.findFirst({
    where: { userId, title: LINUX_MASTER_PLAN.title },
  });
  if (existing) return { ok: false, reason: "already seeded" };

  async function create(page: SeedPage, parentId: string | null) {
    const created = await prisma.wikiPage.create({
      data: {
        userId,
        title: page.title,
        icon: page.icon ?? null,
        content: page.content,
        parentId,
      },
    });
    if (page.children) {
      for (const child of page.children) {
        await create(child, created.id);
      }
    }
  }

  await create(LINUX_MASTER_PLAN, null);
  return { ok: true };
}
