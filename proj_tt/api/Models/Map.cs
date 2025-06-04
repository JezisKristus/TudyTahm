using Org.BouncyCastle.Bcpg.OpenPgp;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace TT_API.Models
{
    public class Map
    {

        [Key]
        public int MapID { get; set; }
        public int IDUser { get; set; }
        public string MapName { get; set; }
        public string MapPath { get; set; }

        public string MapPreviewPath { get; set; }

        public string MapDescription { get; set; }


        [ForeignKey("IDUser")]
        public User User { get; set; }
    }
}
