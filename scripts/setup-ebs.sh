#!/usr/bin/env bash
# ==============================================================================
# CHRIST CLUB ONLINE STORE - AMAZON EBS GP3 VOLUME MOUNTING SCRIPT
# ==============================================================================
# Target OS: Amazon Linux 2023 (EC2 Instance A)
# Run as root or with sudo: sudo bash scripts/setup-ebs.sh
# ==============================================================================
set -euo pipefail

MOUNT_DIR="/mnt/demo-ebs"
SAMPLE_FILE="${MOUNT_DIR}/sample-order-file.txt"

echo "============================================================"
echo " STEP 1: DETECTING ATTACHED EBS BLOCK DEVICE"
echo "============================================================"

# List available block devices
lsblk

# Amazon Linux 2023 typically exposes attached EBS volumes as /dev/nvme1n1 or /dev/xvdf
DEVICE=""
if [ -b "/dev/nvme1n1" ]; then
    DEVICE="/dev/nvme1n1"
elif [ -b "/dev/xvdf" ]; then
    DEVICE="/dev/xvdf"
elif [ -b "/dev/sdf" ]; then
    DEVICE="/dev/sdf"
else
    # Auto-detect secondary disk that is not root
    CANDIDATE=$(lsblk -dn -o NAME,TYPE | awk '$2=="disk" && $1!="nvme0n1" && $1!="xvda" {print "/dev/"$1}' | head -n 1)
    if [ -n "$CANDIDATE" ] && [ -b "$CANDIDATE" ]; then
        DEVICE="$CANDIDATE"
    fi
fi

if [ -z "$DEVICE" ]; then
    echo "ERROR: Could not automatically locate the attached EBS volume."
    echo "Please inspect 'lsblk' output and attach the volume in the AWS EC2 Console."
    exit 1
fi

echo "Identified target EBS block device: ${DEVICE}"

echo "============================================================"
echo " STEP 2: SAFETY CHECK (CHECK IF FILESYSTEM EXISTS)"
echo "============================================================"
# Check if device already has a filesystem to avoid accidental reformatting!
FS_TYPE=$(blkid -o value -s TYPE "${DEVICE}" || true)

if [ -n "${FS_TYPE}" ]; then
    echo "Filesystem already exists on ${DEVICE}: [${FS_TYPE}]. Skipping format to preserve existing data."
else
    echo "Device ${DEVICE} is unformatted. Formatting as ext4 filesystem..."
    mkfs -t ext4 "${DEVICE}"
    echo "Device ${DEVICE} successfully formatted with ext4."
fi

echo "============================================================"
echo " STEP 3: CREATING MOUNT DIRECTORY & PERSISTENT /etc/fstab"
echo "============================================================"
mkdir -p "${MOUNT_DIR}"

# Get the UUID of the device
UUID=$(blkid -o value -s UUID "${DEVICE}")
echo "Device UUID: ${UUID}"

# Check if already present in /etc/fstab
if grep -q "${UUID}" /etc/fstab; then
    echo "UUID already exists in /etc/fstab."
else
    echo "Adding persistent mount entry to /etc/fstab..."
    echo "UUID=${UUID}  ${MOUNT_DIR}  ext4  defaults,nofail  0  2" >> /etc/fstab
fi

# Mount all filesystems defined in /etc/fstab
echo "Mounting volume..."
mount -a

# Set ownership so standard ec2-user and node process can write to it
if id "ec2-user" &>/dev/null; then
    chown -R ec2-user:ec2-user "${MOUNT_DIR}"
fi
chmod 775 "${MOUNT_DIR}"

echo "============================================================"
echo " STEP 4: VERIFYING MOUNT & WRITING SAMPLE ORDER FILE"
echo "============================================================"
df -h "${MOUNT_DIR}"

cat << EOF > "${SAMPLE_FILE}"
============================================================
CHRIST CLUB ONLINE STORE - AMAZON EBS BLOCK STORAGE DEMO
============================================================
Creation Date:  $(date -u +"%Y-%m-%dT%H:%M:%SZ")
Server Host:    $(hostname)
Filesystem:     ext4 on Amazon EBS gp3
Mount Path:     ${MOUNT_DIR}
Device UUID:    ${UUID}
------------------------------------------------------------
This file demonstrates persistent block storage on Amazon EBS.
Unlike instance store disks, data on this volume persists
across instance stops, starts, and restarts.
============================================================
EOF

echo "Sample file created at: ${SAMPLE_FILE}"
echo "----------------- File Content -----------------"
cat "${SAMPLE_FILE}"
echo "------------------------------------------------"
echo "SUCCESS: Amazon EBS gp3 volume mounted and verified!"
