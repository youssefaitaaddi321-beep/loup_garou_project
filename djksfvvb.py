import random
from Crypto.Util.number import isPrime, inverse

# The target public modulus from stage1_loader.py
target_N = 30784491092025369185458724136811917360620533522364893869379539225591043099733084049667854927153764036276158209940119497488774234688420598034244347099338470629728592533221210197210921641669560901470901825193328021392193001923102170544487434715697875466042473101349350108938556952240335499635746116643984925806638118932717000441049631837764607076414210667609442914364125073474544981599070284499742902470007806420265078291450606690736977742317602020399454166257658487142046073332384039502152239990577170532957698833110145268491891960866607464294526067558055819373513134708856237104252953302202578988013327336832692410989
e = 65537

# 1. Seed the PRNG with the exact timestamp found in the log
random.seed(1713842388)

def get_prime(bits):
    while True:
        p = random.getrandbits(bits)
        if isPrime(p):
            return p

print("[*] Re-generating primes from the seeded timestamp...")
# 2. Generate the two 512-bit primes in the exact order the author did
p = get_prime(512)
q = get_prime(512)

# 3. Verify against the modulus
if p * q == target_N:
    print("[+] Success! Primes match the target N.")
    
    # 4. Calculate the private exponent
    phi = (p - 1) * (q - 1)
    d = inverse(e, phi)
    
    print(f"\n[+] Private Exponent (d):\n{d}\n")
    print("--> Copy this value and paste it into stage1_loader.py")
else:
    print("[-] Primes did not match. The PRNG state might require advancing.")