using Microsoft.EntityFrameworkCore;
using TT_API.Models;

namespace TT_API {
    public class MyContext : DbContext {


        public DbSet<Label> Labels { get; set; }
        public DbSet<MapLabel> MapLabels { get; set; }
        public DbSet<Map> Maps { get; set; }
        public DbSet<MarkerLabel> MarkerLabels { get; set; }
        public DbSet<Journey> Journeys { get; set; }
        public DbSet<Marker> Markers { get; set; }
        public DbSet<Overlay> Overlays { get; set; }
        public DbSet<Permission> Permissions { get; set; }
        public DbSet<UserGroup> UserGroups { get; set; }
        public DbSet<User> Users { get; set; }
        public DbSet<GPSPoint> GPSPoints { get; set; }

        public DbSet<JourneyPoint> JourneyPoints { get; set; }
        public DbSet<GroupUsers> GroupUsers { get; set; }


        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder) {
            optionsBuilder.UseMySQL("server=mysqlstudenti.litv.sssvt.cz;database=3b1_patejdlstepan_db2;user=patejdlstepan;password=123456;SslMode=none");
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            modelBuilder.Entity<MapLabel>().HasNoKey();
            modelBuilder.Entity<MarkerLabel>().HasNoKey();

        }

    }
}
